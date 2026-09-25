import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStore } from '../../server/db/store';

describe('Phase 2: Database Store & DPDP Compliance', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
  });

  it('creates and retrieves a user', async () => {
    const user = await store.findOrCreateUser('test@swarahealing.com', 'en');
    expect(user.id).toBeDefined();
    expect(user.email).toBe('test@swarahealing.com');

    const fetched = await store.getUserById(user.id);
    expect(fetched?.email).toBe('test@swarahealing.com');
  });

  it('manages single-use 15-minute magic links', async () => {
    const token = store.createMagicLink('practitioner@musicmantra.com');
    expect(token).toBeDefined();

    // Verify valid token
    const email = store.verifyMagicLink(token);
    expect(email).toBe('practitioner@musicmantra.com');

    // Token must be single-use (second verification fails)
    const secondTry = store.verifyMagicLink(token);
    expect(secondTry).toBeNull();
  });

  it('creates active program and manages sessions', async () => {
    const user = await store.findOrCreateUser('user@example.com');
    const program = await store.createProgram(user.id, 'diabetes');

    expect(program.active).toBe(true);
    expect(program.condition).toBe('diabetes');

    const session = await store.createSession({
      program_id: program.id,
      day_index: 1,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      sa_pc: 'D',
      sa_hz: 293.66,
      eval_accuracy: 94,
      mean_accuracy: 92,
      voiced_seconds: 340,
      completed: true,
      app_version: '0.2.0',
    });

    expect(session.id).toBeDefined();
    expect(session.eval_accuracy).toBe(94);

    const sessions = await store.listSessions(program.id);
    expect(sessions.length).toBe(1);
    expect(sessions[0].day_index).toBe(1);
  });

  it('exports complete user data archive compliant with DPDP Act 2023', async () => {
    const user = await store.findOrCreateUser('patient@clinic.com');
    const program = await store.createProgram(user.id, 'thyroid');
    await store.createSession({
      program_id: program.id,
      day_index: 1,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      sa_pc: 'C',
      sa_hz: 261.63,
      eval_accuracy: 91,
      mean_accuracy: 90,
      voiced_seconds: 320,
      completed: true,
      app_version: '0.2.0',
    });

    const archive = await store.exportUserData(user.id);
    expect(archive).toBeDefined();
    expect(archive?.user.email).toBe('patient@clinic.com');
    expect(archive?.programs.length).toBe(1);
    expect(archive?.sessions.length).toBe(1);
    expect(archive?.complianceNotice).toContain('DPDP Act 2023');
  });

  it('permanently cascades and wipes user data upon account deletion', async () => {
    const user = await store.findOrCreateUser('delete-me@privacy.in');
    const program = await store.createProgram(user.id, 'hypertension');
    const session = await store.createSession({
      program_id: program.id,
      day_index: 1,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      sa_pc: 'A',
      sa_hz: 220.0,
      eval_accuracy: 95,
      mean_accuracy: 94,
      voiced_seconds: 400,
      completed: true,
      app_version: '0.2.0',
    });

    expect(store.users.has(user.id)).toBe(true);
    expect(store.programs.has(program.id)).toBe(true);
    expect(store.sessions.has(session.id)).toBe(true);

    const deleted = await store.deleteUser(user.id);
    expect(deleted).toBe(true);

    // Everything must be wiped permanently
    expect(store.users.has(user.id)).toBe(false);
    expect(store.programs.has(program.id)).toBe(false);
    expect(store.sessions.has(session.id)).toBe(false);
  });

  it('cross-checks vocal metadata via POST /api/voice/cross-check', async () => {
    const { requestHandler } = await import('../../server/index');
    const { EventEmitter } = await import('node:events');

    const req = new EventEmitter() as any;
    req.method = 'POST';
    req.url = '/api/voice/cross-check';
    req.headers = { host: 'localhost:3001' };

    const res = {
      statusCode: 200,
      headers: {} as any,
      body: '',
      writeHead(status: number, headers: any) {
        this.statusCode = status;
        this.headers = headers;
      },
      end(chunk?: string) {
        if (chunk) this.body += chunk;
      },
    };

    const promise = requestHandler(req, res as any);

    req.emit(
      'data',
      Buffer.from(
        JSON.stringify({
          condition: 'diabetes',
          saNote: 'C',
          saHz: 261.63,
          measuredHz: 327.04,
          voicedDurationSeconds: 7.5,
        })
      )
    );
    req.emit('end');

    await promise;

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.success).toBe(true);
    expect(data.referenceSample.swar).toBe('Ga');
    expect(data.referenceSample.ratio).toBe(1.25);
    expect(data.therapistGuidance.resonanceState).toBe('Harmonic Lock');
    expect(data.matchScore).toBeGreaterThanOrEqual(95);
  });
});


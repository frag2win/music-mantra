import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { globalStore } from './db/store.js';
import { generate45DayIcsCalendar } from '../src/utils/calendar.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        // 1MB max
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function extractUserId(req: IncomingMessage): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7).trim();
}

export const requestHandler = async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method?.toUpperCase();

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  try {
    // ── Auth Routes ──

    // POST /api/auth/magic-link
    if (method === 'POST' && pathname === '/api/auth/magic-link') {
      const body = await parseBody(req);
      if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
        return json(res, 400, { error: 'Valid email address required.' });
      }

      const token = globalStore.createMagicLink(body.email);
      // In production, integrate email provider (Resend, SendGrid, etc.)
      console.log(`[AUTH] Magic link generated for ${body.email}: http://localhost:5173/?token=${token}`);

      return json(res, 200, {
        success: true,
        message: 'Magic link has been dispatched to your email (valid for 15 minutes).',
        // In local development we include the token for easy instant testing
        devToken: process.env.NODE_ENV !== 'production' ? token : undefined,
      });
    }

    // POST /api/auth/verify
    if (method === 'POST' && pathname === '/api/auth/verify') {
      const body = await parseBody(req);
      if (!body.token) {
        return json(res, 400, { error: 'Verification token required.' });
      }

      const email = globalStore.verifyMagicLink(body.token);
      if (!email) {
        return json(res, 401, { error: 'Invalid or expired magic link token.' });
      }

      const user = await globalStore.findOrCreateUser(email);
      const activeProgram = await globalStore.getActiveProgram(user.id);

      return json(res, 200, {
        token: user.id, // Bearer token for session
        user,
        activeProgram,
      });
    }

    // ── User Management & DPDP Compliance Routes ──

    const userId = extractUserId(req);

    // GET /api/user/profile
    if (method === 'GET' && pathname === '/api/user/profile') {
      if (!userId) return json(res, 401, { error: 'Unauthorized' });
      const user = await globalStore.getUserById(userId);
      if (!user) return json(res, 404, { error: 'User not found' });
      const activeProgram = await globalStore.getActiveProgram(user.id);
      return json(res, 200, { user, activeProgram });
    }

    // PUT /api/user/disclaimer
    if (method === 'PUT' && pathname === '/api/user/disclaimer') {
      if (!userId) return json(res, 401, { error: 'Unauthorized' });
      const user = await globalStore.updateUser(userId, {
        disclaimer_accepted_at: new Date().toISOString(),
      });
      return json(res, 200, { user });
    }

    // GET /api/user/export (DPDP Act 2023 complete data archive)
    if (method === 'GET' && pathname === '/api/user/export') {
      if (!userId) return json(res, 401, { error: 'Unauthorized' });
      const archive = await globalStore.exportUserData(userId);
      if (!archive) return json(res, 404, { error: 'User not found' });
      return json(res, 200, archive);
    }

    // DELETE /api/user (DPDP Act 2023 complete wipe of all personal data)
    if (method === 'DELETE' && pathname === '/api/user') {
      if (!userId) return json(res, 401, { error: 'Unauthorized' });
      const deleted = await globalStore.deleteUser(userId);
      if (!deleted) return json(res, 404, { error: 'User not found' });
      return json(res, 200, {
        success: true,
        message: 'All user data, programs, and session records permanently deleted.',
      });
    }

    // ── Program Routes ──

    // GET /api/programs
    if (method === 'GET' && pathname === '/api/programs') {
      if (!userId) return json(res, 401, { error: 'Unauthorized' });
      const programs = await globalStore.listPrograms(userId);
      return json(res, 200, { programs });
    }

    // POST /api/programs
    if (method === 'POST' && pathname === '/api/programs') {
      if (!userId) return json(res, 401, { error: 'Unauthorized' });
      const body = await parseBody(req);
      if (!body.condition || !['diabetes', 'thyroid', 'hypertension'].includes(body.condition)) {
        return json(res, 400, { error: 'Valid condition required (diabetes, thyroid, hypertension).' });
      }

      const program = await globalStore.createProgram(userId, body.condition, body.tuning || 'just');
      return json(res, 201, { program });
    }

    // ── Session Routes ──

    // GET /api/sessions
    if (method === 'GET' && pathname === '/api/sessions') {
      if (!userId) return json(res, 401, { error: 'Unauthorized' });
      const program = await globalStore.getActiveProgram(userId);
      if (!program) return json(res, 200, { sessions: [] });
      const sessions = await globalStore.listSessions(program.id);
      return json(res, 200, { sessions });
    }

    // POST /api/sessions
    if (method === 'POST' && pathname === '/api/sessions') {
      if (!userId) return json(res, 401, { error: 'Unauthorized' });
      let program = await globalStore.getActiveProgram(userId);
      const body = await parseBody(req);

      if (!program && body.condition) {
        program = await globalStore.createProgram(userId, body.condition);
      }

      if (!program) {
        return json(res, 400, { error: 'No active program found to associate session with.' });
      }

      const session = await globalStore.createSession({
        program_id: program.id,
        day_index: body.dayIndex || 1,
        started_at: body.startedAt || new Date().toISOString(),
        ended_at: body.endedAt || new Date().toISOString(),
        sa_pc: body.saNote || 'C',
        sa_hz: body.saHz || 261.63,
        eval_accuracy: body.evalAccuracy || 0,
        mean_accuracy: body.meanAccuracy || 0,
        voiced_seconds: body.voicedSeconds || 0,
        completed: body.completed ?? true,
        app_version: '0.2.0',
      });

      return json(res, 201, { session });
    }

    // ── Reminders & Calendar ──

    // GET /api/reminders/calendar.ics
    if (method === 'GET' && pathname === '/api/reminders/calendar.ics') {
      const condition = url.searchParams.get('condition') || 'Swara Healing Chanting';
      const icsData = generate45DayIcsCalendar({
        conditionName: condition,
        timeOfDayHour: 7,
      });

      res.writeHead(200, {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="music-mantra-schedule.ics"',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(icsData);
      return;
    }

    // ── Phase 3: Beta Testing, Telemetry & Diagnostics ──

    // POST /api/beta/diagnostics
    if (method === 'POST' && pathname === '/api/beta/diagnostics') {
      const body = await parseBody(req);
      const row = await globalStore.recordDiagnostics({
        timestamp: body.timestamp || new Date().toISOString(),
        browser: body.browser || 'Unknown',
        os: body.os || 'Unknown',
        sample_rate: body.sampleRate,
        audio_worklet: body.audioWorkletSupported ?? false,
        wake_lock: body.wakeLockSupported ?? false,
        user_agent: body.userAgent || 'Unknown',
      });
      return json(res, 201, { success: true, diagnosticId: row.id });
    }

    // POST /api/beta/feedback
    if (method === 'POST' && pathname === '/api/beta/feedback') {
      const body = await parseBody(req);
      if (!body.rating || typeof body.rating !== 'number') {
        return json(res, 400, { error: 'Rating (1-5) is required.' });
      }

      const row = await globalStore.recordFeedback({
        timestamp: new Date().toISOString(),
        email: body.email,
        rating: Math.max(1, Math.min(5, Math.round(body.rating))),
        category: body.category || 'general',
        comments: body.comments || '',
        difficulty: body.difficulty || 'moderate',
      });

      return json(res, 201, { success: true, feedbackId: row.id });
    }

    // GET /api/beta/metrics
    if (method === 'GET' && pathname === '/api/beta/metrics') {
      const metrics = await globalStore.getBetaMetrics();
      return json(res, 200, metrics);
    }

    // 404 Fallback
    return json(res, 404, { error: `Endpoint ${method} ${pathname} not found` });
  } catch (err) {
    console.error('API Error:', err);
    return json(res, 500, { error: 'Internal Server Error' });
  }
};

export const server = createServer(requestHandler);

const isDirectRun = process.argv[1] && (process.argv[1].endsWith('server/index.ts') || process.argv[1].endsWith('server\\index.ts'));

if (isDirectRun && process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🎵 Music Mantra REST API Server running at http://localhost:${PORT}`);
  });
}

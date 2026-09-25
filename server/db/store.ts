import { randomUUID } from 'node:crypto';

export interface UserRow {
  id: string;
  email: string;
  created_at: string;
  locale: string;
  reminder_time: string | null;
  disclaimer_accepted_at: string | null;
  consent_version: number;
}

export interface ProgramRow {
  id: string;
  user_id: string;
  condition: 'diabetes' | 'thyroid' | 'hypertension';
  started_at: string;
  tuning: string;
  active: boolean;
}

export interface SessionRow {
  id: string;
  program_id: string;
  day_index: number;
  started_at: string;
  ended_at: string;
  sa_pc: string;
  sa_hz: number;
  eval_accuracy: number;
  mean_accuracy: number;
  voiced_seconds: number;
  completed: boolean;
  app_version: string;
}

export interface MagicLinkToken {
  token: string;
  email: string;
  expires_at: number;
  used: boolean;
}

export class MemoryStore {
  public users: Map<string, UserRow> = new Map();
  public programs: Map<string, ProgramRow> = new Map();
  public sessions: Map<string, SessionRow> = new Map();
  public magicLinks: Map<string, MagicLinkToken> = new Map();

  // ── User operations ──

  async findOrCreateUser(email: string, locale = 'en'): Promise<UserRow> {
    const normalizedEmail = email.toLowerCase().trim();
    for (const user of this.users.values()) {
      if (user.email === normalizedEmail) {
        return user;
      }
    }

    const newUser: UserRow = {
      id: randomUUID(),
      email: normalizedEmail,
      created_at: new Date().toISOString(),
      locale,
      reminder_time: null,
      disclaimer_accepted_at: null,
      consent_version: 1,
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async getUserById(id: string): Promise<UserRow | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<UserRow | null> {
    const normalized = email.toLowerCase().trim();
    for (const user of this.users.values()) {
      if (user.email === normalized) return user;
    }
    return null;
  }

  async updateUser(id: string, updates: Partial<UserRow>): Promise<UserRow | null> {
    const user = this.users.get(id);
    if (!user) return null;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  /**
   * DPDP Act 2023 Compliant Deletion:
   * Permanently wipes user, active programs, and all recorded sessions.
   */
  async deleteUser(id: string): Promise<boolean> {
    if (!this.users.has(id)) return false;

    // Find all programs belonging to user
    const userProgramIds = new Set<string>();
    for (const [progId, prog] of this.programs.entries()) {
      if (prog.user_id === id) {
        userProgramIds.add(progId);
        this.programs.delete(progId);
      }
    }

    // Cascade delete all sessions of those programs
    for (const [sessId, sess] of this.sessions.entries()) {
      if (userProgramIds.has(sess.program_id)) {
        this.sessions.delete(sessId);
      }
    }

    // Delete user
    this.users.delete(id);
    return true;
  }

  // ── Program operations ──

  async getActiveProgram(userId: string): Promise<ProgramRow | null> {
    for (const prog of this.programs.values()) {
      if (prog.user_id === userId && prog.active) {
        return prog;
      }
    }
    return null;
  }

  async createProgram(
    userId: string,
    condition: 'diabetes' | 'thyroid' | 'hypertension',
    tuning = 'just'
  ): Promise<ProgramRow> {
    // Deactivate existing active programs
    for (const prog of this.programs.values()) {
      if (prog.user_id === userId) {
        prog.active = false;
      }
    }

    const newProg: ProgramRow = {
      id: randomUUID(),
      user_id: userId,
      condition,
      started_at: new Date().toISOString(),
      tuning,
      active: true,
    };
    this.programs.set(newProg.id, newProg);
    return newProg;
  }

  async listPrograms(userId: string): Promise<ProgramRow[]> {
    return Array.from(this.programs.values()).filter((p) => p.user_id === userId);
  }

  // ── Session operations ──

  async createSession(sessionData: Omit<SessionRow, 'id'>): Promise<SessionRow> {
    const newSession: SessionRow = {
      id: randomUUID(),
      ...sessionData,
    };
    this.sessions.set(newSession.id, newSession);
    return newSession;
  }

  async listSessions(programId: string): Promise<SessionRow[]> {
    return Array.from(this.sessions.values())
      .filter((s) => s.program_id === programId)
      .sort((a, b) => a.day_index - b.day_index);
  }

  async exportUserData(userId: string) {
    const user = await this.getUserById(userId);
    if (!user) return null;

    const userPrograms = await this.listPrograms(userId);
    const sessionsList: SessionRow[] = [];
    for (const prog of userPrograms) {
      const sess = await this.listSessions(prog.id);
      sessionsList.push(...sess);
    }

    return {
      exportedAt: new Date().toISOString(),
      complianceNotice: 'DPDP Act 2023 - Complete User Data Archive',
      user,
      programs: userPrograms,
      sessions: sessionsList,
    };
  }

  // ── Magic Link Tokens ──

  createMagicLink(email: string): string {
    const token = randomUUID();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes expiry as per TRD §11
    this.magicLinks.set(token, {
      token,
      email: email.toLowerCase().trim(),
      expires_at: expiresAt,
      used: false,
    });
    return token;
  }

  verifyMagicLink(token: string): string | null {
    const entry = this.magicLinks.get(token);
    if (!entry) return null;
    if (entry.used || Date.now() > entry.expires_at) {
      this.magicLinks.delete(token);
      return null;
    }
    entry.used = true;
    return entry.email;
  }
}

export const globalStore = new MemoryStore();

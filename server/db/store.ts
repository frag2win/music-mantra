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

export interface BetaDiagnosticsRow {
  id: string;
  timestamp: string;
  browser: string;
  os: string;
  sample_rate?: number;
  audio_worklet: boolean;
  wake_lock: boolean;
  user_agent: string;
}

export interface BetaFeedbackRow {
  id: string;
  timestamp: string;
  email?: string;
  rating: number; // 1-5
  category: 'audio_quality' | 'ease_of_use' | 'accuracy' | 'bug' | 'general';
  comments: string;
  difficulty: 'easy' | 'moderate' | 'difficult';
}

export class MemoryStore {
  public users: Map<string, UserRow> = new Map();
  public programs: Map<string, ProgramRow> = new Map();
  public sessions: Map<string, SessionRow> = new Map();
  public magicLinks: Map<string, MagicLinkToken> = new Map();
  public betaDiagnostics: Map<string, BetaDiagnosticsRow> = new Map();
  public betaFeedback: Map<string, BetaFeedbackRow> = new Map();

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

  // ── Phase 3: Beta Diagnostics & Feedback ──

  async recordDiagnostics(diag: Omit<BetaDiagnosticsRow, 'id'>): Promise<BetaDiagnosticsRow> {
    const row: BetaDiagnosticsRow = {
      id: randomUUID(),
      ...diag,
    };
    this.betaDiagnostics.set(row.id, row);
    return row;
  }

  async recordFeedback(feedback: Omit<BetaFeedbackRow, 'id'>): Promise<BetaFeedbackRow> {
    const row: BetaFeedbackRow = {
      id: randomUUID(),
      ...feedback,
    };
    this.betaFeedback.set(row.id, row);
    return row;
  }

  async getBetaMetrics() {
    const allSessions = Array.from(this.sessions.values());
    const totalSessions = allSessions.length;
    const completedSessions = allSessions.filter((s) => s.completed).length;

    const meanEvalAccuracy =
      totalSessions > 0
        ? allSessions.reduce((acc, s) => acc + s.eval_accuracy, 0) / totalSessions
        : 0;

    const meanSessionAccuracy =
      totalSessions > 0
        ? allSessions.reduce((acc, s) => acc + s.mean_accuracy, 0) / totalSessions
        : 0;

    // Condition breakdown
    const conditionCounts: Record<string, number> = {};
    for (const prog of this.programs.values()) {
      conditionCounts[prog.condition] = (conditionCounts[prog.condition] || 0) + 1;
    }

    // Feedback rating average
    const allFeedback = Array.from(this.betaFeedback.values());
    const avgRating =
      allFeedback.length > 0
        ? allFeedback.reduce((acc, f) => acc + f.rating, 0) / allFeedback.length
        : 0;

    return {
      totalUsers: this.users.size,
      totalPrograms: this.programs.size,
      totalSessions,
      completedSessions,
      completionRatePercent: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      meanEvalAccuracy: Math.round(meanEvalAccuracy * 10) / 10,
      meanSessionAccuracy: Math.round(meanSessionAccuracy * 10) / 10,
      conditionDistribution: conditionCounts,
      totalFeedbackEntries: allFeedback.length,
      averageRating: Math.round(avgRating * 10) / 10,
      deviceAuditSubmissions: this.betaDiagnostics.size,
    };
  }
}

export const globalStore = new MemoryStore();

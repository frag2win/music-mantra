import type { HealthCondition, SessionRecord } from '../types';

const API_BASE = '/api';

export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  locale: string;
  reminder_time: string | null;
  disclaimer_accepted_at: string | null;
  consent_version: number;
}

export interface ProgramData {
  id: string;
  user_id: string;
  condition: HealthCondition;
  started_at: string;
  tuning: string;
  active: boolean;
}

export class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = typeof window !== 'undefined' ? localStorage.getItem('swara_token') : null;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('swara_token', token);
    } else {
      localStorage.removeItem('swara_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return Boolean(this.token);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } catch {
        // use default
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }

  async sendMagicLink(email: string): Promise<{ success: boolean; message?: string; devToken?: string }> {
    return this.request('/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyMagicLink(token: string): Promise<{ token: string; user: UserProfile; activeProgram: ProgramData | null }> {
    const result = await this.request<{ token: string; user: UserProfile; activeProgram: ProgramData | null }>(
      '/auth/verify',
      {
        method: 'POST',
        body: JSON.stringify({ token }),
      }
    );
    this.setToken(result.token);
    return result;
  }

  async getProfile(): Promise<{ user: UserProfile; activeProgram: ProgramData | null }> {
    return this.request('/user/profile');
  }

  async acceptDisclaimer(): Promise<{ user: UserProfile }> {
    return this.request('/user/disclaimer', { method: 'PUT' });
  }

  async exportData(): Promise<any> {
    return this.request('/user/export');
  }

  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    const res = await this.request<{ success: boolean; message: string }>('/user', {
      method: 'DELETE',
    });
    this.setToken(null);
    return res;
  }

  async getSessions(): Promise<{ sessions: SessionRecord[] }> {
    return this.request('/sessions');
  }

  async saveSession(session: Partial<SessionRecord>): Promise<{ session: any }> {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    });
  }

  async createProgram(condition: HealthCondition): Promise<{ program: ProgramData }> {
    return this.request('/programs', {
      method: 'POST',
      body: JSON.stringify({ condition }),
    });
  }

  downloadCalendar(condition: string) {
    const url = `${API_BASE}/reminders/calendar.ics?condition=${encodeURIComponent(condition)}`;
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'music-mantra-schedule.ics';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }
}

export const apiClient = new ApiClient();

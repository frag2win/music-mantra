import React, { useState, useEffect } from 'react';
import { apiClient, type UserProfile, type ProgramData } from '../../api/client';
import { CloseIcon, DownloadIcon, TrashIcon, BoltIcon } from './Icons';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthChange?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthChange }) => {
  const [email, setEmail] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeProgram, setActiveProgram] = useState<ProgramData | null>(null);

  const fetchProfile = React.useCallback(async () => {
    try {
      const data = await apiClient.getProfile();
      setUserProfile(data.user);
      setActiveProgram(data.activeProgram);
    } catch {
      apiClient.setToken(null);
      setUserProfile(null);
    }
  }, []);

  useEffect(() => {
    if (isOpen && apiClient.isAuthenticated()) {
      fetchProfile();
    }
  }, [isOpen, fetchProfile]);

  if (!isOpen) return null;

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await apiClient.sendMagicLink(email);
      setMessage(res.message || 'Magic link sent! Check your inbox.');
      if (res.devToken) {
        setDevToken(res.devToken);
        setTokenInput(res.devToken);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async (tokenToVerify?: string) => {
    const t = tokenToVerify || tokenInput;
    if (!t) return;
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.verifyMagicLink(t);
      setUserProfile(res.user);
      setActiveProgram(res.activeProgram);
      setMessage(`Signed in successfully as ${res.user.email}`);
      onAuthChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    apiClient.setToken(null);
    setUserProfile(null);
    setActiveProgram(null);
    setMessage('Signed out.');
    onAuthChange?.();
  };

  const handleExportData = async () => {
    try {
      const data = await apiClient.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `music-mantra-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Export failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to permanently delete your account and all 45-day program data? This action complies with DPDP Act 2023 and cannot be undone.')) {
      return;
    }

    try {
      await apiClient.deleteAccount();
      setUserProfile(null);
      setActiveProgram(null);
      setMessage('Account and all associated records permanently wiped.');
      onAuthChange?.();
    } catch (err) {
      setError('Deletion failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '2rem',
          position: 'relative',
          background: '#1e293b',
          border: '1px solid #475569',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '1.25rem',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Close modal"
        >
          <CloseIcon size={18} />
        </button>

        <h2 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
          {userProfile ? 'Your Swara Account' : 'Sign In / Register'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {userProfile
            ? 'Your 45-day program progress is safely backed up on the server.'
            : 'Passwordless sign-in protects your 45-day healing progress against browser cache eviction.'}
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--danger)', padding: '0.75rem', borderRadius: '8px', color: '#fca5a5', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid var(--success)', padding: '0.75rem', borderRadius: '8px', color: '#86efac', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {message}
          </div>
        )}

        {userProfile ? (
          <div>
            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Email: </span>
                <strong>{userProfile.email}</strong>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Member Since: </span>
                <span>{new Date(userProfile.created_at).toLocaleDateString()}</span>
              </div>
              {activeProgram && (
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Active Program: </span>
                  <strong style={{ textTransform: 'capitalize' }}>{activeProgram.condition}</strong> (Started {new Date(activeProgram.started_at).toLocaleDateString()})
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="btn-secondary" onClick={handleExportData} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <DownloadIcon size={16} /> Export My Data (JSON — DPDP Act)
              </button>
              <button
                className="btn-secondary"
                style={{ borderColor: 'var(--danger)', color: '#fca5a5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                onClick={handleDeleteAccount}
              >
                <TrashIcon size={16} /> Delete Account & All Data
              </button>
              <button className="btn-primary" onClick={handleSignOut} style={{ marginTop: '0.5rem' }}>
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div>
            <form onSubmit={handleSendMagicLink} style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  color: '#f8fafc',
                  marginBottom: '1.25rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontSize: '0.92rem',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.25)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.25)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.85rem' }} disabled={loading}>
                {loading ? 'Sending...' : 'Send Passwordless Magic Link'}
              </button>
            </form>

            {devToken && (
              <div style={{ background: '#0f172a', border: '1px dashed var(--accent-primary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                  <BoltIcon size={14} /> Quick Dev Sign-In
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleVerifyToken(devToken)}
                  disabled={loading}
                >
                  Verify & Sign In Instantly
                </button>
              </div>
            )}

            <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Have a magic link token?
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Paste token..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '6px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                  }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleVerifyToken()}
                  disabled={loading || !tokenInput}
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

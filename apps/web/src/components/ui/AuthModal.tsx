import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { registerUser, loginUser, getCurrentUser, UserOut } from '../../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserOut) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        await registerUser(email, password, fullName);
      }
      const tokenRes = await loginUser(email, password);
      localStorage.setItem('queryspeak_access_token', tokenRes.access_token);
      localStorage.setItem('queryspeak_refresh_token', tokenRes.refresh_token);

      const user = await getCurrentUser();
      onSuccess(user);
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        setError(axiosErr.response?.data?.detail || 'Authentication failed');
      } else {
        setError('Connection failed. Make sure FastAPI server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-ink text-xl font-bold"
        >
          &times;
        </button>

        <div className="flex gap-4 border-b border-border pb-3">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`font-display font-bold text-lg pb-1 ${
              mode === 'login'
                ? 'text-accentCoral border-b-2 border-accentCoral'
                : 'text-muted hover:text-ink'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`font-display font-bold text-lg pb-1 ${
              mode === 'register'
                ? 'text-accentCoral border-b-2 border-accentCoral'
                : 'text-muted hover:text-ink'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="p-3 bg-error/15 border border-error/30 rounded-xl text-error text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-semibold text-muted block mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accentTeal"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted block mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accentTeal"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accentTeal"
            />
          </div>

          <div className="flex gap-2 justify-end mt-2">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Register'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

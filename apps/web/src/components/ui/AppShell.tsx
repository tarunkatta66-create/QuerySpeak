import React from 'react';
import { useTheme } from './ThemeProvider';
import { Button } from './Button';
import { UserOut } from '../../services/api';

interface AppShellProps {
  children?: React.ReactNode;
  leftSidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
  activeTab?: 'workspace' | 'dashboard';
  onTabChange?: (tab: 'workspace' | 'dashboard') => void;
  currentUser?: UserOut | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  leftSidebar,
  rightSidebar,
  activeTab = 'workspace',
  onTabChange,
  currentUser,
  onOpenAuth,
  onLogout,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-background text-ink bg-grain">
      {/* Top Navbar */}
      <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <span className="font-display text-2xl font-bold text-ink">
            QuerySpeak
          </span>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-2">
            <button
              onClick={() => onTabChange?.('workspace')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                activeTab === 'workspace'
                  ? 'bg-accentTeal/15 text-accentTeal border border-accentTeal/30'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Workspace
            </button>
            <button
              onClick={() => onTabChange?.('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                activeTab === 'dashboard'
                  ? 'bg-accentTeal/15 text-accentTeal border border-accentTeal/30'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Dashboard
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accentTeal/15 text-accentTeal border border-accentTeal/30">
                👤 {currentUser.full_name || currentUser.email}
              </span>
              <Button
                variant="ghost"
                onClick={onLogout}
                className="text-xs px-2.5 py-1 text-muted hover:text-error"
              >
                Logout
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={onOpenAuth}
              className="text-xs px-3 py-1.5 font-semibold"
            >
              Sign In
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="text-sm font-medium"
          >
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </Button>
        </div>
      </header>

      {/* Grid or Main view */}
      {leftSidebar || rightSidebar ? (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[260px_1fr_320px] max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
          <aside className="w-full md:w-[260px]">{leftSidebar}</aside>
          <main className="w-full flex-1 min-w-0">{children}</main>
          <aside className="w-full md:w-[320px]">{rightSidebar}</aside>
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">{children}</main>
      )}
    </div>
  );
};

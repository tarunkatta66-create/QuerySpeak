import { useState, useEffect } from 'react';
import { ThemeProvider } from './components/ui/ThemeProvider';
import { AppShell } from './components/ui/AppShell';
import { AuthModal } from './components/ui/AuthModal';
import { HistoryRail, HistoryItem } from './components/HistoryRail';
import { QueryStage } from './components/QueryStage';
import { ResultsPanel, ResultsData, SavedQuery } from './components/ResultsPanel';
import { OrbStatus } from './components/VoiceOrb';
import { DashboardPage } from './pages/DashboardPage';
import { generateQuery, getCurrentUser, UserOut } from './services/api';

const ORB_STATES: OrbStatus[] = ['idle', 'listening', 'thinking', 'done', 'error'];

function MainApp() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'dashboard'>('workspace');
  const [currentUser, setCurrentUser] = useState<UserOut | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Workspace states
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [orbStatusIndex, setOrbStatusIndex] = useState<number>(0); // Default 'idle'
  const [transcript, setTranscript] = useState<string>('');
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [results, setResults] = useState<ResultsData | null>(null);

  const orbStatus = ORB_STATES[orbStatusIndex];

  // Load user on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('queryspeak_access_token');
    if (token) {
      getCurrentUser()
        .then((user) => setCurrentUser(user))
        .catch(() => {
          localStorage.removeItem('queryspeak_access_token');
          localStorage.removeItem('queryspeak_refresh_token');
        });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('queryspeak_access_token');
    localStorage.removeItem('queryspeak_refresh_token');
    setCurrentUser(null);
  };

  const handleToggleOrbStatus = async () => {
    const nextIndex = (orbStatusIndex + 1) % ORB_STATES.length;
    const nextStatus = ORB_STATES[nextIndex];

    if (nextStatus === 'listening') {
      setOrbStatusIndex(1);
      return;
    }

    if (nextStatus === 'thinking' || orbStatus === 'listening') {
      // Transition to thinking while awaiting API response
      setOrbStatusIndex(2); // 'thinking'

      const promptToRun = transcript.trim() || 'Show me the top 5 customers by revenue';
      if (!transcript) setTranscript(promptToRun);

      try {
        const response = await generateQuery(promptToRun);

        setSqlQuery(response.generated_sql);
        const resData: ResultsData = {
          columns: response.columns,
          rows: response.rows,
        };
        setResults(resData);
        setOrbStatusIndex(3); // 'done'

        const newHistoryItem: HistoryItem = {
          id: String(Date.now()),
          query: promptToRun,
          timestamp: 'Just now',
          sql: response.generated_sql,
          results: resData,
        };
        setHistoryItems((prev) => [newHistoryItem, ...prev]);
        setSelectedId(newHistoryItem.id);
      } catch (err) {
        console.error('Text-to-SQL API error:', err);
        setOrbStatusIndex(4); // 'error'
      }
      return;
    }

    setOrbStatusIndex(nextIndex);
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setSelectedId(item.id);
    setTranscript(item.query);
    setSqlQuery(item.sql);
    setResults(item.results);
    setOrbStatusIndex(3); // 'done'
  };

  const handleRunQuery = async (sql: string) => {
    try {
      setOrbStatusIndex(2); // 'thinking'
      const response = await generateQuery(transcript || 'Executed Custom SQL');
      setSqlQuery(sql || response.generated_sql);
      setResults({
        columns: response.columns,
        rows: response.rows,
      });
      setOrbStatusIndex(3); // 'done'
    } catch {
      setOrbStatusIndex(4); // 'error'
    }
  };

  const handleReRunFromDashboard = (saved: SavedQuery) => {
    setTranscript(saved.query);
    setSqlQuery(saved.sql);
    setResults(saved.results);
    setOrbStatusIndex(3);
    setActiveTab('workspace');
  };

  return (
    <>
      <AppShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        leftSidebar={
          activeTab === 'workspace' ? (
            <HistoryRail
              items={historyItems}
              selectedId={selectedId}
              onSelectItem={handleSelectHistory}
            />
          ) : undefined
        }
        rightSidebar={
          activeTab === 'workspace' ? (
            <ResultsPanel
              data={results}
              queryTitle={transcript || 'Query Results'}
              activeSQL={sqlQuery}
            />
          ) : undefined
        }
      >
        {activeTab === 'workspace' ? (
          <QueryStage
            orbStatus={orbStatus}
            onToggleOrbStatus={handleToggleOrbStatus}
            transcript={transcript}
            onTranscriptChange={setTranscript}
            sqlQuery={sqlQuery}
            onRunQuery={handleRunQuery}
          />
        ) : (
          <DashboardPage onReRunQuery={handleReRunFromDashboard} />
        )}
      </AppShell>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => setCurrentUser(user)}
      />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

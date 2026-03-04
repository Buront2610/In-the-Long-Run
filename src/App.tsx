import { useState, useCallback, useRef } from 'react';
import type { Scenario, GameState } from './game/types';
import { GameEngine } from './game/GameEngine';
import { GOVERNMENT_TYPE_LABELS, ERA_LABELS } from './game/constants';
import StartScreen from './components/StartScreen';
import EconomyPanel from './components/EconomyPanel';
import PolicyPanel from './components/PolicyPanel';
import InstitutionPanel from './components/InstitutionPanel';
import InterestGroupPanel from './components/InterestGroupPanel';
import HistoryChart from './components/HistoryChart';
import NewsTicker from './components/NewsTicker';
import TipPopup from './components/TipPopup';
import EventDialog from './components/EventDialog';
import GameOverScreen from './components/GameOverScreen';
import WorldMap from './components/WorldMap';

type ActiveTab = 'economy' | 'policy' | 'institutions' | 'groups' | 'history' | 'map';

function App() {
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('economy');
  const [showTips, setShowTips] = useState(true);

  const handleStart = useCallback((scenario: Scenario) => {
    const e = new GameEngine(scenario);
    engineRef.current = e;
    setGameState({ ...e.getState() });
    setActiveTab('economy');
    setShowTips(true);
  }, []);

  const handleNextTurn = useCallback(() => {
    if (!engineRef.current) return;
    const newState = engineRef.current.nextTurn();
    setGameState({ ...newState });
    setShowTips(true);
  }, []);

  const handleApplyPolicy = useCallback((action: string, value: number) => {
    if (!engineRef.current) return;
    engineRef.current.applyPolicy(action, value);
    setGameState({ ...engineRef.current.getState() });
  }, []);

  const handleAdoptInstitution = useCallback((id: string) => {
    if (!engineRef.current) return;
    engineRef.current.adoptInstitution(id);
    setGameState({ ...engineRef.current.getState() });
  }, []);

  const handleRevokeInstitution = useCallback((id: string) => {
    if (!engineRef.current) return;
    engineRef.current.revokeInstitution(id);
    setGameState({ ...engineRef.current.getState() });
  }, []);

  const handleDiplomaticAction = useCallback((nationId: string, action: string) => {
    if (!engineRef.current) return;
    engineRef.current.performDiplomaticAction(nationId, action);
    setGameState({ ...engineRef.current.getState() });
  }, []);

  const handleEventChoice = useCallback((eventId: string, choiceIndex: number) => {
    if (!engineRef.current) return;
    engineRef.current.handleEventChoice(eventId, choiceIndex);
    setGameState({ ...engineRef.current.getState() });
  }, []);

  const handleRestart = useCallback(() => {
    engineRef.current = null;
    setGameState(null);
  }, []);

  // Start screen
  if (!engineRef.current || !gameState) {
    return <StartScreen onStart={handleStart} />;
  }

  // Game over
  if (gameState.gameOver) {
    return <GameOverScreen state={gameState} onRestart={handleRestart} />;
  }

  // Active event dialog
  const activeEvent = gameState.activeEvents.length > 0 ? gameState.activeEvents[0] : null;

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: 'economy', label: '経済' },
    { key: 'policy', label: '政策' },
    { key: 'institutions', label: '制度' },
    { key: 'groups', label: '利益団体' },
    { key: 'history', label: '歴史' },
    { key: 'map', label: '世界地図' },
  ];

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>In the Long Run</h1>
          <span style={styles.nationName}>{gameState.nationName}</span>
        </div>
        <div style={styles.headerCenter}>
          <span style={styles.year}>{gameState.year}年</span>
          <span style={styles.era}>{ERA_LABELS[gameState.era]}</span>
          <span style={styles.govType}>
            {GOVERNMENT_TYPE_LABELS[gameState.political.governmentType]}
          </span>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.quickStats}>
            <span style={styles.stat}>GDP: {gameState.economic.gdp.toFixed(0)}</span>
            <span style={styles.stat}>人口: {gameState.economic.population.toFixed(1)}M</span>
            <span style={styles.stat}>安定度: {gameState.political.stability.toFixed(0)}</span>
          </div>
          <button style={styles.nextTurnBtn} onClick={handleNextTurn}>
            次のターン ▶
          </button>
        </div>
      </header>

      {/* Tab Bar */}
      <nav style={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            style={{
              ...styles.tabBtn,
              ...(activeTab === tab.key ? styles.tabBtnActive : {}),
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.contentArea}>
          {activeTab === 'economy' && <EconomyPanel economic={gameState.economic} />}
          {activeTab === 'policy' && (
            <PolicyPanel
              economic={gameState.economic}
              actionsUsedThisTurn={gameState.actionsUsedThisTurn}
              onApplyPolicy={handleApplyPolicy}
            />
          )}
          {activeTab === 'institutions' && (
            <InstitutionPanel
              institutions={gameState.institutions}
              onAdopt={handleAdoptInstitution}
              onRevoke={handleRevokeInstitution}
              treasury={gameState.economic.treasury}
            />
          )}
          {activeTab === 'groups' && (
            <InterestGroupPanel interestGroups={gameState.interestGroups} />
          )}
          {activeTab === 'history' && <HistoryChart history={gameState.history} />}
          {activeTab === 'map' && (
            <WorldMap
              playerNation={gameState.nationName}
              era={gameState.era}
              year={gameState.year}
              economic={gameState.economic}
              political={gameState.political}
              foreignNations={gameState.foreignNations}
              onDiplomaticAction={handleDiplomaticAction}
            />
          )}
        </div>

        {/* Sidebar: News */}
        <aside style={styles.sidebar}>
          <NewsTicker news={gameState.news} />
        </aside>
      </main>

      {/* Event Dialog */}
      {activeEvent && (
        <EventDialog event={activeEvent} onChoice={handleEventChoice} />
      )}

      {/* Tips Popup */}
      {showTips && (
        <TipPopup tips={gameState.tips} onDismiss={() => setShowTips(false)} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    background: '#1a1a2e',
    color: '#eee',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    background: '#16213e',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    flexWrap: 'wrap',
    gap: '8px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '16px',
  },
  headerCenter: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  title: {
    margin: 0,
    fontSize: '1.3rem',
    color: '#e94560',
    fontStyle: 'italic',
  },
  nationName: {
    fontSize: '0.95rem',
    color: '#aaa',
  },
  year: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#fff',
  },
  era: {
    fontSize: '0.85rem',
    color: '#aaa',
    padding: '2px 8px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '4px',
  },
  govType: {
    fontSize: '0.85rem',
    color: '#ffcc00',
  },
  quickStats: {
    display: 'flex',
    gap: '12px',
    fontSize: '0.82rem',
    color: '#ccc',
  },
  stat: {
    whiteSpace: 'nowrap',
  },
  nextTurnBtn: {
    padding: '8px 20px',
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#fff',
    background: '#e94560',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  tabBar: {
    display: 'flex',
    gap: '2px',
    padding: '0 24px',
    background: '#16213e',
  },
  tabBtn: {
    padding: '10px 20px',
    fontSize: '0.9rem',
    color: '#aaa',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    transition: 'color 0.2s, border-color 0.2s',
  },
  tabBtnActive: {
    color: '#fff',
    borderBottomColor: '#e94560',
  },
  main: {
    display: 'flex',
    flex: 1,
    padding: '16px 24px',
    gap: '16px',
    overflow: 'auto',
  },
  contentArea: {
    flex: 1,
    minWidth: 0,
  },
  sidebar: {
    width: '320px',
    flexShrink: 0,
  },
};

export default App;

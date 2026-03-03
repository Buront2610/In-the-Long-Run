import React, { useState } from 'react';
import type { Scenario } from '../game/types';
import { SCENARIOS } from '../game/constants';

const SCENARIO_META: Record<string, { difficulty: string; difficultyColor: string; challenge: string; tips: string }> = {
  modern_democracy: {
    difficulty: "★☆☆ 入門",
    difficultyColor: "#53d769",
    challenge: "安定した民主国家の持続的発展",
    tips: "バランスの取れた政策運営を心がけよう。まずは制度の採用から始めるのがおすすめ。",
  },
  emerging_nation: {
    difficulty: "★★☆ 中級",
    difficultyColor: "#ffcc00",
    challenge: "急速な近代化と政治的安定の両立",
    tips: "インフレと失業率の制御が鍵。教育・インフラ投資で長期成長の基盤を築こう。",
  },
  ancient_empire: {
    difficulty: "★★★ 上級",
    difficultyColor: "#e94560",
    challenge: "限られた制度で広大な帝国を維持",
    tips: "軍事費と安定度のバランスが生命線。制度の段階的な導入で近代化を目指そう。",
  },
  reform_crisis: {
    difficulty: "★★★ 上級",
    difficultyColor: "#e94560",
    challenge: "体制崩壊後の経済危機と政治混乱の克服",
    tips: "まず財政の安定化を優先。急激な改革は避け、段階的な制度構築を。",
  },
  meiji_restoration: {
    difficulty: "★★☆ 中級",
    difficultyColor: "#ffcc00",
    challenge: "封建体制から近代国家への大転換",
    tips: "教育と軍事の近代化を同時に進めよう。制度の前提条件に注目。",
  },
  military_to_democracy: {
    difficulty: "★★☆ 中級",
    difficultyColor: "#ffcc00",
    challenge: "軍部の抵抗を抑えつつ民主化を実現",
    tips: "軍部の満足度に注意しつつ、段階的に民主的制度を導入しよう。",
  },
  superpower_decline: {
    difficulty: "★★★ 上級",
    difficultyColor: "#e94560",
    challenge: "肥大化した超大国の改革と再生",
    tips: "軍事費の段階的削減と研究投資の拡大がポイント。急激な改革は不安定化を招く。",
  },
};

interface StartScreenProps {
  onStart: (scenario: Scenario) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [selected, setSelected] = useState<string | null>(null);

  const selectedScenario = SCENARIOS.find((s) => s.id === selected) ?? null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>In the Long Run</h1>
        <p style={styles.subtitle}>長期的には、我々はみな死んでいる</p>
        <p style={styles.intro}>
          国家の経済・政治・制度を運営し、歴史の荒波を乗り越えよう。
          あなたの政策判断が国家の命運を左右する。
        </p>
      </div>

      <h2 style={styles.sectionTitle}>シナリオを選択</h2>
      <div style={styles.cardGrid}>
        {SCENARIOS.map((scenario) => {
          const meta = SCENARIO_META[scenario.id];
          return (
            <div
              key={scenario.id}
              style={{
                ...styles.card,
                ...(selected === scenario.id ? styles.cardSelected : {}),
              }}
              onClick={() => setSelected(scenario.id)}
            >
              <h3 style={styles.cardTitle}>{scenario.name}</h3>
              <p style={styles.cardDesc}>{scenario.description}</p>
              <span style={styles.cardYear}>開始年: {scenario.startYear}年</span>
              {meta && (
                <>
                  <div style={{ fontSize: 11, color: meta.difficultyColor, fontWeight: 'bold', marginTop: 8 }}>
                    難易度: {meta.difficulty}
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                    挑戦: {meta.challenge}
                  </div>
                  {selected === scenario.id && (
                    <div style={{
                      fontSize: 11,
                      color: '#4a9eff',
                      marginTop: 6,
                      padding: '6px 8px',
                      background: 'rgba(74,158,255,0.08)',
                      borderRadius: 4,
                      lineHeight: 1.4,
                    }}>
                      💡 {meta.tips}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <button
        style={{
          ...styles.startButton,
          ...(selectedScenario ? {} : styles.startButtonDisabled),
        }}
        disabled={!selectedScenario}
        onClick={() => selectedScenario && onStart(selectedScenario)}
      >
        ゲーム開始
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    color: '#eee',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    fontFamily: 'sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    margin: 0,
    letterSpacing: 2,
    color: '#fff',
  },
  subtitle: {
    fontSize: 18,
    color: '#e94560',
    marginTop: 8,
    fontStyle: 'italic',
  },
  intro: {
    fontSize: 14,
    color: '#aaa',
    maxWidth: 520,
    marginTop: 16,
    lineHeight: 1.6,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 16,
    color: '#ccc',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 16,
    maxWidth: 1040,
    width: '100%',
    marginBottom: 32,
  },
  card: {
    background: '#0f3460',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 20,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  cardSelected: {
    borderColor: '#e94560',
    boxShadow: '0 0 12px rgba(233,69,96,0.4)',
  },
  cardTitle: {
    margin: '0 0 8px',
    fontSize: 18,
    color: '#fff',
  },
  cardDesc: {
    fontSize: 13,
    color: '#bbb',
    lineHeight: 1.5,
    margin: '0 0 12px',
  },
  cardYear: {
    fontSize: 12,
    color: '#ffcc00',
    fontWeight: 'bold',
  },
  startButton: {
    padding: '14px 48px',
    fontSize: 18,
    fontWeight: 'bold',
    background: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    letterSpacing: 1,
  },
  startButtonDisabled: {
    background: '#555',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
};

export default StartScreen;

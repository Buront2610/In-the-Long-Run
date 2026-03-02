import React from 'react';
import type { GameEvent } from '../game/types';

interface EventDialogProps {
  event: GameEvent;
  onChoice: (eventId: string, choiceIndex: number) => void;
}

const EventDialog: React.FC<EventDialogProps> = ({ event, onChoice }) => {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>{event.title}</h2>
        <p style={styles.desc}>{event.description}</p>

        {event.tip && (
          <div style={styles.tipBox}>
            <span style={styles.tipIcon}>💡</span>
            <span style={styles.tipText}>{event.tip}</span>
          </div>
        )}

        <div style={styles.choices}>
          {event.choices.map((choice, i) => (
            <button
              key={i}
              style={styles.choiceButton}
              onClick={() => onChoice(event.id, i)}
            >
              {choice.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#16213e',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: '28px 32px',
    maxWidth: 480,
    width: '90%',
    boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
  },
  title: {
    margin: '0 0 12px',
    fontSize: 22,
    color: '#fff',
  },
  desc: {
    margin: '0 0 16px',
    fontSize: 14,
    color: '#ccc',
    lineHeight: 1.6,
  },
  tipBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    background: 'rgba(255,204,0,0.08)',
    border: '1px solid rgba(255,204,0,0.2)',
    borderRadius: 6,
    padding: '10px 12px',
    marginBottom: 16,
  },
  tipIcon: {
    fontSize: 16,
    flexShrink: 0,
  },
  tipText: {
    fontSize: 13,
    color: '#ffcc00',
    lineHeight: 1.5,
    fontStyle: 'italic',
  },
  choices: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  choiceButton: {
    padding: '10px 16px',
    fontSize: 14,
    background: '#0f3460',
    color: '#eee',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 6,
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'background 0.15s',
  },
};

export default EventDialog;

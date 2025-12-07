import React from 'react';
import { GameState } from '../types';

interface HUDProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const HUD: React.FC<HUDProps> = ({ gameState, setGameState }) => {
  
  const adjustSpeed = (delta: number) => {
    setGameState(prev => {
      const newSpeed = Math.max(0.5, Math.min(3.0, prev.gameSpeed + delta));
      return { ...prev, gameSpeed: parseFloat(newSpeed.toFixed(2)) };
    });
  };

  return (
    <div className="flex justify-between items-center w-full max-w-[800px] mb-2 px-4 py-2 bg-slate-900/80 border border-slate-700 rounded text-cyan-400 font-['Orbitron']">
      <div className="flex flex-col">
        <span className="text-xs text-slate-500">SCORE</span>
        <span className="text-xl font-bold tracking-widest">{gameState.score.toString().padStart(6, '0')}</span>
      </div>
      
      <div className="flex flex-col items-center">
        <span className="text-xs text-slate-500">LEVEL</span>
        <span className="text-xl font-bold">{gameState.level}</span>
      </div>

      <div className="flex gap-8">
        <div className="flex flex-col items-center">
            <span className="text-xs text-slate-500">SPEED</span>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => adjustSpeed(-0.1)}
                    onMouseDown={(e) => e.preventDefault()}
                    tabIndex={-1}
                    className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs active:bg-slate-600"
                >-</button>
                <span className="text-sm font-bold min-w-[3ch] text-center">{gameState.gameSpeed}x</span>
                <button 
                    onClick={() => adjustSpeed(0.1)}
                    onMouseDown={(e) => e.preventDefault()}
                    tabIndex={-1}
                    className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs active:bg-slate-600"
                >+</button>
            </div>
        </div>

        <div className="flex flex-col items-end">
            <span className="text-xs text-slate-500">LIVES</span>
            <div className="flex gap-1">
            {Array.from({length: Math.max(0, gameState.lives)}).map((_, i) => (
                <div key={i} className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[12px] border-b-cyan-400"></div>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default HUD;
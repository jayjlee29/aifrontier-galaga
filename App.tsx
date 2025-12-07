import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import MissionControl from './components/MissionControl';
import HUD from './components/HUD';
import { GameState, GameStatus, Briefing } from './types';
import { INITIAL_LIVES } from './constants';
import { getMissionBriefing } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    lives: INITIAL_LIVES,
    status: GameStatus.MENU,
    highScore: 0,
    gameSpeed: 0.5
  });

  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  const handleBriefingRequest = async (status: string) => {
    setLoadingBriefing(true);
    // Determine context based on status trigger
    const context = status === "START_GAME" ? "Game Starting" : 
                    status === "GAME_OVER" ? "Pilot Failed" : 
                    "Level Complete";
    
    try {
        const data = await getMissionBriefing(gameState.level, gameState.score, context);
        setBriefing(data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoadingBriefing(false);
    }
  };

  useEffect(() => {
    // Initial welcome
    handleBriefingRequest("STARTUP");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 font-['Orbitron'] tracking-widest uppercase">
          Neon Galaga
        </h1>
        <p className="text-slate-500 text-sm">Powered by Gemini Tactical Engine</p>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row items-start justify-center w-full max-w-7xl">
        
        {/* Game Column */}
        <div className="flex flex-col items-center">
          <HUD gameState={gameState} setGameState={setGameState} />
          <GameCanvas 
            gameState={gameState} 
            setGameState={setGameState}
            onBriefingRequest={handleBriefingRequest}
          />
          <div className="mt-4 text-slate-500 text-xs font-mono">
            CONTROLS: ARROW KEYS to Move | SPACE to Shoot
          </div>
        </div>

        {/* AI Side Panel */}
        <MissionControl briefing={briefing} loading={loadingBriefing} />
        
      </div>
    </div>
  );
};

export default App;
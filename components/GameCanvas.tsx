import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SPEED, BULLET_SPEED, COLORS, KEYS, FIRE_COOLDOWN, INITIAL_LIVES } from '../constants';
import { GameStatus, Player, Enemy, Bullet, Particle, GameState, Entity } from '../types';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onBriefingRequest: (status: string) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState, onBriefingRequest }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  
  // Local state for countdowns
  const [countdown, setCountdown] = useState(3);
  
  // Game Entities Refs (Mutable state for performance)
  const playerRef = useRef<Player>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 50,
    dx: 0, dy: 0,
    width: 30, height: 30,
    active: true,
    color: COLORS.primary,
    cooldown: 0,
    hp: 1
  });
  
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Particle[]>([]);

  // Input state
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // --- Initialization ---
  
  const initStars = () => {
    const stars: Particle[] = [];
    for(let i=0; i<100; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        dx: 0,
        dy: (Math.random() * 0.5) + 0.1,
        width: Math.random() > 0.9 ? 2 : 1,
        height: Math.random() > 0.9 ? 2 : 1,
        life: 100, maxLife: 100,
        active: true,
        color: Math.random() > 0.8 ? COLORS.secondary : '#ffffff'
      });
    }
    starsRef.current = stars;
  };

  const initLevel = useCallback((level: number) => {
    const rows = 3 + Math.min(level, 4);
    const cols = 8;
    const enemies: Enemy[] = [];
    
    for(let r=0; r<rows; r++) {
      for(let c=0; c<cols; c++) {
        const type = r === 0 ? 'commander' : r === 1 ? 'scout' : 'drone';
        const color = type === 'commander' ? COLORS.danger : type === 'scout' ? COLORS.secondary : COLORS.accent;
        
        enemies.push({
          x: 100 + (c * 60),
          y: 50 + (r * 50),
          dx: 1 + (level * 0.1),
          dy: 0,
          width: 24,
          height: 24,
          active: true,
          color: color,
          type: type,
          scoreValue: (rows - r) * 100,
          diveTimer: Math.random() * 1000
        });
      }
    }
    enemiesRef.current = enemies;
    bulletsRef.current = [];
    particlesRef.current = [];
    playerRef.current.x = CANVAS_WIDTH / 2;
    // Player active state is managed by the countdown logic for transitions
    if (level > 1) {
       // Keep player visible/active during level transition visuals
       playerRef.current.active = true;
    }
  }, []);

  // --- Game Loop Helpers ---

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for(let i=0; i<count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3;
      particlesRef.current.push({
        x, y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        width: 2, height: 2,
        active: true,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        color: color
      });
    }
  };

  const checkCollision = (rect1: Entity, rect2: Entity) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  };

  // --- Main Update Loop ---
  
  const update = () => {
    if (gameState.status === GameStatus.MENU || gameState.status === GameStatus.GAME_OVER) return;

    // Apply speed multiplier
    const speedFactor = gameState.gameSpeed || 1.0;

    // Always update stars for parallax effect in background
    starsRef.current.forEach(star => {
      star.y += star.dy * speedFactor;
      if (star.y > CANVAS_HEIGHT) star.y = 0;
    });

    // Always update particles (allows explosions to finish during RESPAWN/TRANSITION)
    particlesRef.current.forEach(p => {
      p.x += p.dx * speedFactor;
      p.y += p.dy * speedFactor;
      p.life -= speedFactor;
      if (p.life <= 0) p.active = false;
    });
    particlesRef.current = particlesRef.current.filter(p => p.active);

    // Freeze game logic during countdowns
    if (gameState.status === GameStatus.RESPAWN || gameState.status === GameStatus.LEVEL_TRANSITION) {
        return;
    }

    // --- PLAYING LOGIC ---
    frameCountRef.current++;
    const player = playerRef.current;

    // Player Movement
    if (player.active) {
        const moveSpeed = PLAYER_SPEED * speedFactor;
        if (KEYS.LEFT.some(k => keysPressed.current[k])) player.x -= moveSpeed;
        if (KEYS.RIGHT.some(k => keysPressed.current[k])) player.x += moveSpeed;
        
        // Clamp Player
        player.x = Math.max(0, Math.min(CANVAS_WIDTH - player.width, player.x));

        // Player Shooting
        if (player.cooldown > 0) player.cooldown -= speedFactor;
        if (KEYS.SHOOT.some(k => keysPressed.current[k]) && player.cooldown <= 0) {
        bulletsRef.current.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            dx: 0,
            dy: -BULLET_SPEED, // Initial velocity, scaled during update
            width: 4,
            height: 10,
            active: true,
            color: COLORS.primary,
            isEnemy: false
        });
        player.cooldown = FIRE_COOLDOWN;
        }
    }

    // Update Enemies
    let changingDirection = false;
    enemiesRef.current.forEach(enemy => {
      if (!enemy.active) return;
      
      // Basic formation movement
      enemy.x += enemy.dx * speedFactor;

      // Wall bounce check
      if (enemy.x <= 10 || enemy.x + enemy.width >= CANVAS_WIDTH - 10) {
        changingDirection = true;
      }

      // Enemy Shooting - adjust probability by speed so frequency stays roughly relative to action
      if (Math.random() < (0.005 + (gameState.level * 0.001)) * speedFactor) {
        bulletsRef.current.push({
          x: enemy.x + enemy.width / 2,
          y: enemy.y + enemy.height,
          dx: 0,
          dy: BULLET_SPEED * 0.6,
          width: 4,
          height: 10,
          active: true,
          color: COLORS.danger,
          isEnemy: true
        });
      }
    });

    if (changingDirection) {
      enemiesRef.current.forEach(e => {
        e.dx = -e.dx;
        e.y += 10; // Vertical drop doesn't need scaling as it's a discrete step
      });
    }

    // Update Bullets
    bulletsRef.current.forEach(b => {
      b.x += b.dx * speedFactor;
      b.y += b.dy * speedFactor;
      
      // Screen bounds
      if (b.y < 0 || b.y > CANVAS_HEIGHT) b.active = false;

      // Collisions
      if (b.active) {
        if (!b.isEnemy) {
          // Player bullet hitting enemy
          enemiesRef.current.forEach(e => {
            if (e.active && checkCollision(b, e)) {
              e.active = false;
              b.active = false;
              spawnParticles(e.x + e.width/2, e.y + e.height/2, e.color, 8);
              setGameState(prev => ({ ...prev, score: prev.score + e.scoreValue }));
            }
          });
        } else {
          // Enemy bullet hitting player
          if (player.active && checkCollision(b, player)) {
            b.active = false;
            handlePlayerHit();
          }
        }
      }
    });

    // Enemy collision with player (Body slam)
    enemiesRef.current.forEach(e => {
      if (e.active && player.active && checkCollision(e, player)) {
        e.active = false;
        handlePlayerHit();
      }
    });

    // Cleanup Inactive
    enemiesRef.current = enemiesRef.current.filter(e => e.active);
    bulletsRef.current = bulletsRef.current.filter(b => b.active);

    // Level Clear Check
    if (enemiesRef.current.length === 0) {
        handleLevelComplete();
    }
  };

  const handlePlayerHit = () => {
    spawnParticles(playerRef.current.x, playerRef.current.y, COLORS.primary, 20);
    playerRef.current.active = false;
    
    setGameState(prev => {
      const newLives = prev.lives - 1;
      if (newLives <= 0) {
        onBriefingRequest("GAME_OVER");
        return { ...prev, lives: 0, status: GameStatus.GAME_OVER };
      }
      return { ...prev, lives: newLives, status: GameStatus.RESPAWN };
    });
  };

  const handleLevelComplete = () => {
    // Prevent multiple triggers
    if (enemiesRef.current.length > 0) return;
    
    setGameState(prev => {
        const nextLevel = prev.level + 1;
        const nextSpeed = parseFloat((prev.gameSpeed + 0.01).toFixed(2));
        onBriefingRequest(`LEVEL_${nextLevel}`);
        initLevel(nextLevel);
        return { ...prev, level: nextLevel, gameSpeed: nextSpeed, status: GameStatus.LEVEL_TRANSITION };
    });
  };

  // --- Draw Loop ---

  const draw = (ctx: CanvasRenderingContext2D) => {
    // Clear
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Stars
    ctx.fillStyle = "#ffffff";
    starsRef.current.forEach(s => {
      ctx.globalAlpha = Math.random() * 0.5 + 0.5;
      ctx.fillRect(s.x, s.y, s.width, s.height);
    });
    ctx.globalAlpha = 1.0;

    // Draw Player
    const p = playerRef.current;
    // Only draw player if active and not Game Over
    // During LEVEL_TRANSITION, we might want to show the player if they are active
    if ((gameState.status !== GameStatus.GAME_OVER) && p.active) {
      ctx.fillStyle = p.color;
      // Simple Ship Shape
      ctx.beginPath();
      ctx.moveTo(p.x + p.width / 2, p.y);
      ctx.lineTo(p.x + p.width, p.y + p.height);
      ctx.lineTo(p.x + p.width / 2, p.y + p.height - 5);
      ctx.lineTo(p.x, p.y + p.height);
      ctx.closePath();
      ctx.fill();
    }

    // Draw Enemies
    enemiesRef.current.forEach(e => {
      ctx.fillStyle = e.color;
      // Alien Shape (Pixel art style rects)
      const w = e.width;
      const h = e.height;
      
      // Body
      ctx.fillRect(e.x + w*0.2, e.y + h*0.2, w*0.6, h*0.6);
      // Arms/Legs - animate slightly based on frame
      const legOffset = (Math.floor(frameCountRef.current / 20) % 2 === 0) ? 0 : 2;
      ctx.fillRect(e.x, e.y + h*0.2 - legOffset, w*0.2, h*0.4);
      ctx.fillRect(e.x + w*0.8, e.y + h*0.2 - legOffset, w*0.2, h*0.4);
    });

    // Draw Bullets
    bulletsRef.current.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.width, b.height);
    });

    // Draw Particles
    particlesRef.current.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillRect(pt.x, pt.y, pt.width, pt.height);
    });
    ctx.globalAlpha = 1.0;
  };

  const renderLoop = () => {
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            update();
            draw(ctx);
        }
    }
    requestRef.current = requestAnimationFrame(renderLoop);
  };

  // --- Effects ---

  useEffect(() => {
    initStars();
    renderLoop();
    return () => cancelAnimationFrame(requestRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.status, gameState.gameSpeed]); 

  // Combined Countdown Logic for Respawn and Level Start
  useEffect(() => {
    let interval: number;
    let timeout: number;

    const isRespawn = gameState.status === GameStatus.RESPAWN;
    const isLevelStart = gameState.status === GameStatus.LEVEL_TRANSITION;

    if (isRespawn || isLevelStart) {
        setCountdown(3);
        
        // Count down: 3 -> 2 -> 1 -> 0 (Action Phase)
        interval = window.setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        // After 4 seconds (3, 2, 1, Action), resume game
        timeout = window.setTimeout(() => {
            if (isRespawn) {
                playerRef.current.x = CANVAS_WIDTH / 2;
                playerRef.current.active = true;
                playerRef.current.cooldown = 0;
                bulletsRef.current = bulletsRef.current.filter(b => !b.isEnemy);
            }
            if (isLevelStart) {
                 playerRef.current.active = true;
            }
            
            setGameState(prev => ({ ...prev, status: GameStatus.PLAYING }));
        }, 4000);
    }

    return () => {
        clearInterval(interval);
        clearTimeout(timeout);
    };
  }, [gameState.status, setGameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
        if (KEYS.LEFT.includes(e.key) || KEYS.RIGHT.includes(e.key) || KEYS.SHOOT.includes(e.key)) {
            e.preventDefault();
        }
        
        keysPressed.current[e.key] = true; 

        if (e.key === '+' || e.key === '=') {
            setGameState(prev => {
              const newSpeed = Math.max(0.5, Math.min(3.0, prev.gameSpeed + 0.1));
              return { ...prev, gameSpeed: parseFloat(newSpeed.toFixed(2)) };
            });
        }
        if (e.key === '-' || e.key === '_') {
            setGameState(prev => {
              const newSpeed = Math.max(0.5, Math.min(3.0, prev.gameSpeed - 0.1));
              return { ...prev, gameSpeed: parseFloat(newSpeed.toFixed(2)) };
            });
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => { 
        keysPressed.current[e.key] = false; 
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setGameState]);

  return (
    <div className="relative border-4 border-cyan-500 rounded-lg shadow-[0_0_20px_rgba(0,255,255,0.5)] overflow-hidden">
      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT} 
        className="bg-black block"
      />
      
      {gameState.status === GameStatus.MENU && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
          <h1 className="text-6xl text-cyan-400 font-bold mb-8 font-['Press_Start_2P'] drop-shadow-[0_0_10px_rgba(0,255,255,0.8)] text-center leading-normal">
            NEON<br/>GALAGA
          </h1>
          <button 
            onClick={() => {
                setGameState(prev => ({
                    ...prev, 
                    status: GameStatus.LEVEL_TRANSITION, 
                    score: 0, 
                    lives: INITIAL_LIVES, 
                    level: 1,
                    gameSpeed: 0.5
                }));
                initLevel(1);
                onBriefingRequest("START_GAME");
            }}
            className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xl rounded transition-all hover:scale-105 border-2 border-cyan-300"
          >
            INSERT COIN / START
          </button>
        </div>
      )}

      {/* Unified Countdown Overlay */}
      {(gameState.status === GameStatus.RESPAWN || gameState.status === GameStatus.LEVEL_TRANSITION) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10 backdrop-blur-sm">
            <h2 className="text-cyan-400 text-2xl font-['Orbitron'] font-bold mb-4 tracking-widest animate-pulse">
                {gameState.status === GameStatus.RESPAWN ? "SYSTEM RESTORE" : "HYPERSPACE JUMP"}
            </h2>
            <div className="text-white text-6xl font-['Press_Start_2P'] drop-shadow-[0_0_15px_rgba(0,255,255,0.8)] text-center">
                {countdown > 0 
                  ? countdown 
                  : gameState.status === GameStatus.RESPAWN 
                    ? "GO!" 
                    : `Start Level ${gameState.level}`}
            </div>
        </div>
      )}

      {gameState.status === GameStatus.GAME_OVER && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10">
          <h2 className="text-red-500 text-5xl font-bold mb-4 font-['Press_Start_2P']">GAME OVER</h2>
          <p className="text-white text-xl mb-8">FINAL SCORE: {gameState.score}</p>
          <button 
            onClick={() => {
                setGameState(prev => ({...prev, status: GameStatus.MENU}));
            }}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded"
          >
            RETURN TO BASE
          </button>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
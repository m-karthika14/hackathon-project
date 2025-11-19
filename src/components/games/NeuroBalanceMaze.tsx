import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { Howl } from 'howler';

// --- STYLE COMPONENTS ---
// Memoized to prevent re-rendering since styles are static
const GlobalStyles = memo(() => (
    <style>{`
        /* * IMPORTANT: For the UI to display correctly, please add the following font imports 
         * to your main public/index.html file inside the <head> tag:
         * * <link rel="preconnect" href="https://fonts.googleapis.com">
         * <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
         * <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Orbitron:wght@700&display=swap" rel="stylesheet">
         * */
        :root {
            --bg-color:rgb(0, 0, 0);
            --primary-neon: #00FFC0;
            --secondary-neon: #FF4D4D;
            --goal-neon: #4D94FF;
            --distractor-neon: #FFC300;
            --text-color: #A0A0A0;
            --wall-color: #222222;
            --ui-glow: rgba(0, 255, 192, 0.5);
        }
        /* Prevent any page-level scrolling while the Maze is active by constraining html/body/root
           These rules are injected when the Maze component mounts so they only apply on the Maze page. */
        html, body, #root {
            overflow: hidden !important;
            height: 100% !important;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
            /* Match the home page gradient so the maze shares the same background */
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: var(--text-color);
            /* Keep the page visually fixed for the maze — prevent a persistent vertical scrollbar */
            overflow: hidden;
            /* don't force a centered flex body here; the .app-container can center when needed */
        }
        #particle-canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
        }
        #root {
            width: 100%;
            height: 100%;
            display: block;
            z-index: 1;
        }
        .app-container {
            width: 100%;
            /* Ensure the app container never grows past the viewport while Maze is active */
            max-height: 100vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            padding: 1rem;
            box-sizing: border-box;
        }
        .app-container.center-content {
            justify-content: center;
        }
        .btn {
            background: linear-gradient(45deg, var(--primary-neon), #00b386);
            border: none;
            color: #000;
            padding: 1rem 2.5rem;
            font-size: 1.2rem;
            font-family: 'Orbitron', sans-serif;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 0 15px var(--ui-glow), inset 0 0 5px rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            letter-spacing: 2px;
            border-radius: 50px;
            position: relative;
            overflow: hidden;
        }
        .btn:hover {
            transform: scale(1.05);
            box-shadow: 0 0 25px var(--ui-glow), 0 0 40px var(--primary-neon);
        }
        .btn:disabled {
            background: var(--wall-color);
            cursor: not-allowed;
            box-shadow: none;
        }
        .btn::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: conic-gradient(transparent, rgba(255, 255, 255, 0.2), transparent 30%);
            animation: rotate 4s linear infinite;
        }
        .screen-container {
            animation: fadeIn 1s ease-in-out;
            max-width: 700px;
            width: 100%;
            padding: 2.5rem;
            box-sizing: border-box;
            background: transparent;
            backdrop-filter: blur(10px);
            border: 1px solid var(--wall-color);
            border-radius: 20px;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
            position: relative;
        }
        .screen-container::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 20px;
            padding: 1px;
            background: linear-gradient(45deg, var(--primary-neon), var(--goal-neon));
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
        }
        .start-screen h1 {
            font-family: 'Orbitron', sans-serif;
            font-size: 3.5rem;
            color: var(--primary-neon);
            text-shadow: 0 0 15px var(--primary-neon);
            margin-bottom: 1rem;
            text-align: center;
        }
        .start-screen p {
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 2.5rem; /* Adjusted margin */
            text-align: center;
        }
        .start-screen .button-container {
            text-align: center;
        }
        .game-screen {
            width: 100%;
            /* Fit to viewport while accounting for top padding/margins to avoid unwanted vertical scroll */
            min-height: calc(100vh - 120px);
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 80px 20px 20px 20px;
            overflow: hidden;
            box-sizing: border-box;
        }
        .game-ui {
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            display: flex;
            justify-content: space-between;
            font-size: 1.8rem;
            font-family: 'Orbitron', sans-serif;
            z-index: 10;
            pointer-events: none;
            text-shadow: 0 0 8px var(--bg-color);
            color: var(--primary-neon);
        }
        .maze-container {
            position: relative;
            border: 2px solid var(--primary-neon);
            box-shadow: 0 0 20px var(--ui-glow);
            background-color: var(--bg-color);
            margin-top: 40px;
        }
        .maze-grid-wrapper {
            display: grid;
        }
        .maze-cell { background-color: transparent; }
    /* Use a faint neon tint for maze walls so they contrast with the dark gradient background */
    .maze-cell.wall-top { border-top: 1px solid rgba(0,255,192,0.12); }
    .maze-cell.wall-right { border-right: 1px solid rgba(0,255,192,0.12); }
    .maze-cell.wall-bottom { border-bottom: 1px solid rgba(0,255,192,0.12); }
    .maze-cell.wall-left { border-left: 1px solid rgba(0,255,192,0.12); }
        .player, .goal, .moving-wall {
            position: absolute;
            border-radius: 50%;
        }
        .player {
            background-color: var(--primary-neon);
            box-shadow: 0 0 12px var(--primary-neon);
            transition: all 0.1s linear;
            z-index: 5;
        }
        .goal {
            background-color: var(--goal-neon);
            box-shadow: 0 0 12px var(--goal-neon);
            z-index: 4;
            animation: pulse-blue 2s infinite;
        }
        .moving-wall {
            background-color: var(--wall-color);
            z-index: 3;
            box-shadow: 0 0 10px #000;
            transition: all 1s ease-in-out;
            border-radius: 0;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-blue { 0% { transform: scale(1); box-shadow: 0 0 10px var(--goal-neon); } 50% { transform: scale(1.1); box-shadow: 0 0 20px var(--goal-neon); } 100% { transform: scale(1); box-shadow: 0 0 10px var(--goal-neon); } }
        @keyframes rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @media (max-width: 768px) {
            .game-ui { font-size: 1rem; }
            .start-screen h1 { font-size: 2.5rem; }
        }
    `}</style>
));

// --- HELPER COMPONENTS & UTILS ---
const ParticleAnimation = memo(() => {
    useEffect(() => {
        const canvas = document.createElement('canvas');
        canvas.id = 'particle-canvas';
        document.body.insertBefore(canvas, document.body.firstChild);
        const ctx = canvas.getContext('2d');
        let particles = [];
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        let animationFrameId: number;

        const createParticle = () => ({
            x: Math.random() * canvas.width, y: 0,
            size: Math.random() * 2 + 1, speed: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.2
        });

        for(let i = 0; i < 100; i++) particles.push(createParticle());

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.y += p.speed;
                if (p.y > canvas.height) { p.y = 0; p.x = Math.random() * canvas.width; }
                ctx.beginPath();
                ctx.fillStyle = `rgba(0, 255, 192, ${p.opacity})`;
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            animationFrameId = requestAnimationFrame(animate);
        };
        
        animate();
        const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        window.addEventListener('resize', handleResize);
        
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        }
    }, []);
    return null;
});

// Maze-specific particle background (uses a lightweight canvas animation)
const MazeParticleBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const particles: { x: number; y: number; vx: number; vy: number }[] = [];
        const particleCount = 70;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Create particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
            });
        }

        let rafId: number;

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p) => {
                // Move particle
                p.x += p.vx;
                p.y += p.vy;

                // Boundary wrap
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.fill();

                // Draw lines between near particles
                particles.forEach((other) => {
                    const dx = p.x - other.x;
                    const dy = p.y - other.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 120) {
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 - distance / 1200})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.stroke();
                    }
                });
            });

            rafId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-0 pointer-events-none"
        />
    );
};

const sounds = {
    move: new Howl({ src: ['data:audio/wav;base64,UklGRloAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YRgAAAAgAAAA//8BAP//AAAA//8CAP//AgD//wEAAAAA'] }),
    collide: new Howl({ src: ['data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YUYAAAAgAAAAQQBIAEwAUgBbAHEAfQCIAIgAigCIAHwAdgBvAGoAZwBmA2YDaQNoA2YDXgNSAy4DIgMaAwoDGgANAx4ADg=='] }),
    level_complete: new Howl({ src: ['data:audio/wav;base64,UklGRlgAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YRAAAAC4AP8/ALgA/z8AAAAALgD/AD8AAAAALgD/Pw=='] }),
    game_complete: new Howl({ src: ['data:audio/wav;base64,UklGRlAAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YUYAAAAgAAAAKgA/AEgATwBVAFYAVQBRAEwARQBAADsAKgAfABMAAwD/APUA8gDwAO8A7wDsAOsA6wDqAOoA6gDqAOoA6gDqAOoA6gDqAOoA6gDqAOoA6g=='] }),
};

const generateMaze = (width: number, height: number) => {
    let grid = Array(height).fill(null).map(() => Array(width).fill(null).map(() => ({ top: true, right: true, bottom: true, left: true, visited: false })));
    
    // Start from top-left corner (0,0) to ensure connectivity to start position
    let stack: [number, number][] = [];
    let [cx, cy] = [0, 0];
    grid[cy][cx].visited = true; 
    stack.push([cx, cy]);
    
    while (stack.length > 0) {
        [cx, cy] = stack[stack.length - 1];
        let neighbors: [number, number, string][] = [];
        
        // Check all four directions for unvisited neighbors
        if (cy > 0 && !grid[cy - 1][cx].visited) neighbors.push([cx, cy - 1, 'top']);
        if (cx < width - 1 && !grid[cy][cx + 1].visited) neighbors.push([cx + 1, cy, 'right']);
        if (cy < height - 1 && !grid[cy + 1][cx].visited) neighbors.push([cx, cy + 1, 'bottom']);
        if (cx > 0 && !grid[cy][cx - 1].visited) neighbors.push([cx - 1, cy, 'left']);
        
        if (neighbors.length > 0) {
            let [nx, ny, dir] = neighbors[Math.floor(Math.random() * neighbors.length)];
            
            // Remove walls between current cell and chosen neighbor
            if (dir === 'top') { 
                grid[cy][cx].top = false; 
                grid[ny][nx].bottom = false; 
            }
            if (dir === 'right') { 
                grid[cy][cx].right = false; 
                grid[ny][nx].left = false; 
            }
            if (dir === 'bottom') { 
                grid[cy][cx].bottom = false; 
                grid[ny][nx].top = false; 
            }
            if (dir === 'left') { 
                grid[cy][cx].left = false; 
                grid[ny][nx].right = false; 
            }
            
            grid[ny][nx].visited = true; 
            stack.push([nx, ny]);
        } else { 
            stack.pop(); 
        }
    }
    
    // Ensure there's always a path to the bottom-right corner by removing some strategic walls
    // Create additional openings if needed - enhanced for Level 2 with multiple paths
    for (let attempts = 0; attempts < 15; attempts++) {
        const testPath = findShortestPath(grid, { x: 0, y: 0 }, { x: width - 1, y: height - 1 });
        if (testPath !== Infinity && testPath > 0) break;
        
        // Add more openings to increase connectivity, especially for larger mazes
        const numOpenings = Math.max(5, Math.floor(width * height * 0.08));
        for (let i = 0; i < numOpenings; i++) {
            const rx = Math.floor(Math.random() * (width - 1));
            const ry = Math.floor(Math.random() * (height - 1));
            
            if (Math.random() > 0.5 && rx < width - 1) {
                grid[ry][rx].right = false;
                grid[ry][rx + 1].left = false;
            } else if (ry < height - 1) {
                grid[ry][rx].bottom = false;
                grid[ry + 1][rx].top = false;
            }
        }
    }
    
    // Final guarantee: create a direct path if none exists
    const finalTest = findShortestPath(grid, { x: 0, y: 0 }, { x: width - 1, y: height - 1 });
    if (finalTest === Infinity) {
        // Force create a simple path along the edges
        for (let x = 0; x < width - 1; x++) {
            grid[height - 1][x].right = false;
            grid[height - 1][x + 1].left = false;
        }
        for (let y = 0; y < height - 1; y++) {
            grid[y][width - 1].bottom = false;
            grid[y + 1][width - 1].top = false;
        }
    }
    
    // For Level 2 specifically, create additional alternative paths to ensure moving walls can't block everything
    if (width === 15 && height === 15) {
        // Create a secondary path through the middle
        const midRow = Math.floor(height / 2);
        for (let x = 0; x < width - 1; x++) {
            if (Math.random() > 0.3) { // 70% chance to open each horizontal connection in middle
                grid[midRow][x].right = false;
                grid[midRow][x + 1].left = false;
            }
        }
        
        // Create vertical connections to the middle path
        const midCol = Math.floor(width / 2);
        for (let y = 0; y < height - 1; y++) {
            if (Math.random() > 0.3) { // 70% chance to open each vertical connection in middle
                grid[y][midCol].bottom = false;
                grid[y + 1][midCol].top = false;
            }
        }
        
        // Ensure connection from start to middle path
        for (let i = 0; i < midRow; i++) {
            if (Math.random() > 0.5) {
                grid[i][0].bottom = false;
                grid[i + 1][0].top = false;
            }
        }
        
        // Ensure connection from middle path to end
        for (let i = midRow; i < height - 1; i++) {
            if (Math.random() > 0.5) {
                grid[i][width - 1].bottom = false;
                grid[i + 1][width - 1].top = false;
            }
        }
    }
    
    return grid;
};

const findShortestPath = (maze: any[][], start: {x: number, y: number}, end: {x: number, y: number}): number => {
    if(!maze.length || !maze[0].length) return Infinity;
    const width = maze[0].length, height = maze.length;
    const queue: [{x: number, y: number}, {x: number, y: number}[]][] = [[start, [start]]];
    const visited = new Set([`${start.x},${start.y}`]);
    while (queue.length > 0) {
        const item = queue.shift();
        if (!item) continue;
        const [{ x, y }, path] = item;
        if (x === end.x && y === end.y) return path.length - 1; // Return moves count, not positions
        const moves: {x: number, y: number}[] = []; 
        const cell = maze[y][x];
        if (!cell.top && y > 0) moves.push({ x, y: y - 1 });
        if (!cell.right && x < width - 1) moves.push({ x: x + 1, y });
        if (!cell.bottom && y < height - 1) moves.push({ x, y: y + 1 });
        if (!cell.left && x > 0) moves.push({ x: x - 1, y });
        for (const move of moves) {
            const key = `${move.x},${move.y}`;
            if (!visited.has(key)) {
                visited.add(key);
                queue.push([move, [...path, move]]);
            }
        }
    }
    return Infinity;
};

// --- STUB COMPONENTS REMOVED ---
// --- GAME COMPONENTS ---
const StartScreen = memo(({ onStart }: { onStart: () => void }) => (
    <div className="screen-container start-screen">
        <h1>NeuroBalance Maze</h1>
        <p>This is an interactive experience designed to engage and assess key neurocognitive functions like motor control, and adaptability under cognitive load. Your performance will be analyzed to provide a personalized report.</p>
        <div className="button-container">
            <button className="btn" onClick={onStart}>Start Assessment</button>
        </div>
    </div>
));

interface GameScreenProps {
    onGameComplete: (metrics: any, log: any[], diagnostics?: any) => void;
}
interface MazeCell {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
  visited: boolean;
}
interface MovingWall {
  id: number;
  x: number;
  y: number;
  dir: string;
}
const GameScreen = ({ onGameComplete }: GameScreenProps) => {
    const LEVEL_CONFIG: { [key: number]: { size: number; features: string[]; numMovingWalls: number } } = {
        1: { size: 15, features: ['dimLightingBlink'], numMovingWalls: 0 },
        2: { size: 15, features: ['movingWalls'], numMovingWalls: 4 }
    };
    const [level, setLevel] = useState<number>(1);
    const [maze, setMaze] = useState<MazeCell[][]>([]);
    const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [goalPos, setGoalPos] = useState<{ x: number; y: number }>({ x: 14, y: 14 });
    const [timer, setTimer] = useState<number>(0);
    const [isBlinking, setIsBlinking] = useState<boolean>(false);
    const [movingWalls, setMovingWalls] = useState<MovingWall[]>([]);
    const metrics = useRef<any>({});
    const cellSize = useRef<number>(25); // Increased default cell size
    const containerRef = useRef<HTMLDivElement>(null);
    const errorLog = useRef<any[]>([]);
    // Track last movement time for inactivity detection and move timestamps
    const lastMoveTime = useRef<number | null>(null);
    const moveTimestamps = useRef<{ time: number; from?: {x:number;y:number}; to?: {x:number;y:number}; direction?: string }[]>([]);
    const idleSegments = useRef<{ start: string; durationSec: number; level?: number }[]>([]);
    const inputMethod = useRef<'keyboard'|'mouse'|'touch'|'unknown'>('unknown');
    const microMovementBuffer = useRef<{time:number;dir:string}[]>([]);
    const idleStart = useRef<number | null>(null);
    
    const startLevel = useCallback((currentLevel: number) => {
        const config = LEVEL_CONFIG[currentLevel];
        const newMaze = generateMaze(config.size, config.size);
        const start = { x: 0, y: 0 };
        const end = { x: config.size - 1, y: config.size - 1 };
        setMaze(newMaze); setPlayerPos(start); setGoalPos(end);
        
        const newMovingWalls: MovingWall[] = [];
        if (config.features.includes('movingWalls')) {
            // First, ensure we have a baseline solution
            let baselinePath = findShortestPath(newMaze, start, end);
            console.log(`Baseline solution before adding moving walls: ${baselinePath === Infinity ? 'NO SOLUTION' : baselinePath + ' moves'}`);
            
            // Generate moving walls that don't block the path
            for (let i = 0; i < config.numMovingWalls; i++) {
                let wallX, wallY;
                let attempts = 0;
                let validPlacement = false;
                
                do {
                    wallX = Math.floor(Math.random() * (config.size - 4)) + 2; // More restrictive range
                    wallY = Math.floor(Math.random() * (config.size - 4)) + 2;
                    attempts++;
                    
                    // If we can't find a good spot after many attempts, use a safe zone
                    if (attempts > 100) {
                        // Place in center area which is less likely to block critical paths
                        wallX = Math.floor(config.size / 2) + (Math.random() > 0.5 ? 1 : -1);
                        wallY = Math.floor(config.size / 2) + (Math.random() > 0.5 ? 1 : -1);
                        validPlacement = true;
                        break;
                    }
                    
                    // More sophisticated placement rules
                    const tooCloseToStart = (wallX <= 2 && wallY <= 2);
                    const tooCloseToEnd = (wallX >= config.size - 3 && wallY >= config.size - 3);
                    const onMainDiagonal = Math.abs(wallX - wallY) <= 1; // Avoid main diagonal
                    const onEdgePath = (wallX === 0 || wallY === 0 || wallX === config.size - 1 || wallY === config.size - 1);
                    
                    validPlacement = !tooCloseToStart && !tooCloseToEnd && !onMainDiagonal && !onEdgePath;
                    
                } while (!validPlacement);
                
                newMovingWalls.push({ id: i, x: wallX, y: wallY, dir: Math.random() > 0.5 ? 'x' : 'y' });
            }
            
            // After placing all moving walls, verify we still have multiple paths
            // Add some additional openings if the maze became too constrained
            const postWallPath = findShortestPath(newMaze, start, end);
            if (postWallPath === Infinity || postWallPath > baselinePath * 2) {
                console.log('Adding extra connectivity for Level 2...');
                // Add extra horizontal and vertical corridors
                const midY = Math.floor(config.size / 2);
                for (let x = 1; x < config.size - 1; x += 2) {
                    newMaze[midY][x].right = false;
                    newMaze[midY][x + 1].left = false;
                }
                
                const midX = Math.floor(config.size / 2);
                for (let y = 1; y < config.size - 1; y += 2) {
                    newMaze[y][midX].bottom = false;
                    newMaze[y + 1][midX].top = false;
                }
            }
        }
        setMovingWalls(newMovingWalls);
        
        // Verify solution still exists and update shortest path - FINAL GUARANTEE
        let finalShortestPath = findShortestPath(newMaze, start, end);
        
        // If no solution exists, force create one
        if (finalShortestPath === Infinity) {
            console.warn('No solution found! Creating emergency path...');
            // Create a guaranteed path along the bottom and right edges
            for (let x = 0; x < config.size - 1; x++) {
                newMaze[config.size - 1][x].right = false;
                newMaze[config.size - 1][x + 1].left = false;
            }
            for (let y = 0; y < config.size - 1; y++) {
                newMaze[y][config.size - 1].bottom = false;
                newMaze[y + 1][config.size - 1].top = false;
            }
            // Also create a path from start to the edge path
            for (let y = 0; y < config.size - 1; y++) {
                newMaze[y][0].bottom = false;
                newMaze[y + 1][0].top = false;
            }
            
            finalShortestPath = findShortestPath(newMaze, start, end);
        }
        
        console.log(`Level ${currentLevel} maze FINAL. Solution path length: ${finalShortestPath === Infinity ? 'NO SOLUTION' : finalShortestPath + ' moves'}`);
        
        // Double-check: If we STILL don't have a solution, create the most basic path
        if (finalShortestPath === Infinity) {
            console.error('CRITICAL: Still no solution! Creating basic L-shaped path...');
            // Remove all walls along bottom row (horizontal path)
            for (let x = 0; x < config.size - 1; x++) {
                newMaze[config.size - 1][x].right = false;
                newMaze[config.size - 1][x + 1].left = false;
            }
            // Remove all walls along leftmost column (vertical path to bottom)
            for (let y = 0; y < config.size - 1; y++) {
                newMaze[y][0].bottom = false;
                newMaze[y + 1][0].top = false;
            }
            finalShortestPath = findShortestPath(newMaze, start, end);
            console.log(`Emergency L-path created. Length: ${finalShortestPath}`);
        }
        
        metrics.current[currentLevel] = {
            startTime: Date.now(), moves: 0, wallCollisions: 0, sharpTurns: 0, path: [start],
            shortestPath: finalShortestPath
        };
    }, []);

    // Initialize the first level when component mounts
    useEffect(() => {
        startLevel(level);
    }, [startLevel, level]);

    useEffect(() => {
        const interval = setInterval(() => setTimer(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);
    
    useEffect(() => {
        if (!LEVEL_CONFIG[level].features.includes('dimLightingBlink')) { setIsBlinking(false); return; }
        const blinkInterval = setInterval(() => setIsBlinking(prevState => !prevState), 3000);
        return () => clearInterval(blinkInterval);
    }, [level]);

    useEffect(() => {
        const updateCellSize = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                const mazeSize = LEVEL_CONFIG[level].size;
                // Make the maze much larger to match reference image  
                const availableSize = Math.min(width * 0.9, height * 0.7);
                cellSize.current = Math.max(35, availableSize / mazeSize);
                setPlayerPos(p => ({...p})); 
            }
        };
        updateCellSize(); window.addEventListener('resize', updateCellSize);
        return () => window.removeEventListener('resize', updateCellSize);
    }, [level]);

    useEffect(() => {
        if (!LEVEL_CONFIG[level].features.includes('movingWalls')) return;
        const interval = setInterval(() => {
            setMovingWalls(prev => prev.map(wall => {
                let { x, y, dir } = wall;
                const size = LEVEL_CONFIG[level].size;
                if (dir === 'x') {
                    if (x <= 1 || x >= size - 2) wall.dir = 'y'; else x += (Math.random() > 0.5 ? 1 : -1);
                } else {
                    if (y <= 1 || y >= size - 2) wall.dir = 'x'; else y += (Math.random() > 0.5 ? 1 : -1);
                }
                return { ...wall, x, y };
            }));
        }, 2000);
        return () => clearInterval(interval);
    }, [level]);

    const logError = useCallback((event: string, details?: any) => {
        // Attach timestamp, level, and optional details (position, sequence, extra)
        const nowIso = new Date().toISOString();
        const entry: any = { time: nowIso, level, event };
        if (details) Object.assign(entry, details);
        errorLog.current.push(entry);
    }, [level]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!maze.length) return;
        let { x, y } = playerPos;
        const currentCell = maze[y][x];
        let dx = 0, dy = 0;
        const keyMap: { [key: string]: string } = { ArrowUp: 'U', KeyW: 'U', ArrowDown: 'D', KeyS: 'D', ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R' };
        const move = keyMap[e.code];
        if (!move) return;

        const nowMs = Date.now();
        // record input method as keyboard
        inputMethod.current = 'keyboard';

        let intendedMove = true;
        if (move === 'U' && !currentCell.top) dy = -1;
        else if (move === 'D' && !currentCell.bottom) dy = 1;
        else if (move === 'L' && !currentCell.left) dx = -1;
        else if (move === 'R' && !currentCell.right) dx = 1;
        else {
            // wall collision: include position and sequence
            metrics.current[level].wallCollisions = (metrics.current[level].wallCollisions || 0) + 1;
            logError("Wall collision", { position: { x, y }, attemptedDir: move, sequence: metrics.current[level].moves || 0 });
            sounds.collide.play();
            intendedMove = false;
        }
        
        if (intendedMove) {
            const nextX = x + dx, nextY = y + dy;
            const collisionWithMovingWall = movingWalls.some(wall => wall.x === nextX && wall.y === nextY);
            if (collisionWithMovingWall) {
                metrics.current[level].wallCollisions = (metrics.current[level].wallCollisions || 0) + 1;
                logError("Blocked by moving wall", { position: { x: nextX, y: nextY }, attemptedDir: move, sequence: metrics.current[level].moves || 0 });
                sounds.collide.play();
            } else {
                // Movement happened — update movement timestamps and idle tracking
                const from = { x, y };
                const to = { x: nextX, y: nextY };

                // Decision latency: record first movement latency for this level
                if (!metrics.current[level].decisionLatency && metrics.current[level].startTime) {
                    metrics.current[level].decisionLatency = nowMs - (metrics.current[level].startTime || nowMs);
                }

                // Update last move time and record move timestamp
                lastMoveTime.current = nowMs;
                moveTimestamps.current.push({ time: nowMs, from, to, direction: move });

                // If we were idle, close the idle segment and record duration
                if (idleStart.current) {
                    const idleEnd = nowMs;
                    const durationSec = Math.round((idleEnd - idleStart.current) / 1000);
                    const startIso = new Date(idleStart.current).toISOString();
                    idleSegments.current.push({ start: startIso, durationSec, level });
                    logError('Idle resumed', { start: startIso, durationSec, level });
                    idleStart.current = null;
                }

                // Micro-movement detection: quick back-and-forth or tiny reversals
                microMovementBuffer.current.push({ time: nowMs, dir: move });
                // Trim buffer to last 800ms
                microMovementBuffer.current = microMovementBuffer.current.filter(m => nowMs - m.time <= 800);
                // If we see a reversal within 500ms, count as microMovement
                if (microMovementBuffer.current.length >= 2) {
                    const last = microMovementBuffer.current[microMovementBuffer.current.length - 1];
                    const prev = microMovementBuffer.current[microMovementBuffer.current.length - 2];
                    if (last.dir !== prev.dir && (nowMs - prev.time) <= 500) {
                        metrics.current[level].microMovements = (metrics.current[level].microMovements || 0) + 1;
                    }
                }

                setPlayerPos({ x: nextX, y: nextY });
                metrics.current[level].moves = (metrics.current[level].moves || 0) + 1; sounds.move.play();
                const path = metrics.current[level].path; path.push({x: nextX, y: nextY});
                if (path.length > 2) {
                    const [p1, p2, p3] = path.slice(-3);
                    if (Math.abs(Math.atan2(p2.y - p1.y, p2.x - p1.x) - Math.atan2(p3.y - p2.y, p3.x - p2.x)) > Math.PI / 4) {
                        metrics.current[level].sharpTurns = (metrics.current[level].sharpTurns || 0) + 1;
                    }
                }
            }
        }
    }, [playerPos, maze, level, movingWalls, logError]);
    
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Track input method (pointer/touch/keyboard) and detect idle segments (>5s inactivity)
    useEffect(() => {
        const onPointer = (ev: any) => {
            try {
                if (ev && ev.pointerType === 'touch') inputMethod.current = 'touch';
                else if (ev && ev.pointerType) inputMethod.current = 'mouse';
                else inputMethod.current = 'mouse';
            } catch (e) { inputMethod.current = 'unknown'; }
        };
        const onTouch = () => { inputMethod.current = 'touch'; };

        window.addEventListener('pointerdown', onPointer);
        window.addEventListener('touchstart', onTouch);

        const idleCheck = setInterval(() => {
            const now = Date.now();
            if (!lastMoveTime.current) return;
            // if we are not already marked idle and it's been >5s since last move, mark idle start
            if (!idleStart.current && (now - lastMoveTime.current) > 5000) {
                idleStart.current = lastMoveTime.current + 5000; // idle start when threshold crossed
                const startIso = new Date(idleStart.current).toISOString();
                logError('Idle started', { start: startIso, level });
            }
        }, 1000);

        return () => {
            window.removeEventListener('pointerdown', onPointer);
            window.removeEventListener('touchstart', onTouch);
            clearInterval(idleCheck);
        };
    }, [level, logError]);
    
    useEffect(() => {
        if (playerPos.x === goalPos.x && playerPos.y === goalPos.y) {
            console.log(`🎯 Player reached goal at level ${level}!`);
            console.log(`🎯 Player position: (${playerPos.x}, ${playerPos.y})`);
            console.log(`🎯 Goal position: (${goalPos.x}, ${goalPos.y})`);
            console.log(`Total levels: ${Object.keys(LEVEL_CONFIG).length}`);
            console.log(`Current level: ${level}`);
            console.log(`Condition (level >= total): ${level} >= ${Object.keys(LEVEL_CONFIG).length} = ${level >= Object.keys(LEVEL_CONFIG).length}`);
            
            metrics.current[level].completionTime = Date.now() - metrics.current[level].startTime;
            if (level >= Object.keys(LEVEL_CONFIG).length) {
                console.log(`🏁 All levels complete! Calling onGameComplete...`);
                sounds.game_complete.play();
                // Pass diagnostics collected during the run so the parent can build detailed logs
                onGameComplete(metrics.current, errorLog.current, { moveTimestamps: moveTimestamps.current, idleSegments: idleSegments.current, inputMethod: inputMethod.current });
            } else {
                console.log(`⬆️ Moving to next level (${level + 1})`);
                sounds.level_complete.play(); 
                setLevel(l => l + 1); 
                setTimer(0);
            }
        }
    }, [playerPos, goalPos, level, onGameComplete]);

    const cSize = Math.max(25, cellSize.current); // Increased minimum cell size
    const mazeSize = LEVEL_CONFIG[level].size;
    const features = LEVEL_CONFIG[level].features;
    
    const mazeContainerStyle = useMemo<React.CSSProperties>(() => {
        const style: React.CSSProperties = {
            position: 'relative', width: `${cSize * mazeSize}px`, height: `${cSize * mazeSize}px`,
            border: '2px solid var(--primary-neon)', boxShadow: '0 0 20px var(--ui-glow)',
            backgroundColor: 'var(--bg-color)',
        };
        const applySpotlight = (features.includes('dimLightingBlink') && isBlinking);
        if(applySpotlight) {
            const lightRadius = cSize * 4.0;
            const maskCenterX = (playerPos.x + 0.5) * cSize;
            const maskCenterY = (playerPos.y + 0.5) * cSize;
            const gradientStyle = `radial-gradient(circle ${lightRadius}px at ${maskCenterX}px ${maskCenterY}px, black 85%, transparent 100%)`;
            (style as any)['-webkit-mask-image'] = gradientStyle;
            (style as any)['mask-image'] = gradientStyle;
        }
        return style;
    }, [cSize, mazeSize, features, isBlinking, playerPos]);

    const mazeGridWrapperStyle = useMemo<React.CSSProperties>(() => {
        return {
            display: 'grid',
            gridTemplateColumns: `repeat(${mazeSize}, ${cSize}px)`,
            gridTemplateRows: `repeat(${mazeSize}, ${cSize}px)`
        };
    }, [mazeSize, cSize]);
    
    const playerStyle = useMemo<React.CSSProperties>(() => ({
        width: `${cSize * 0.7}px`, height: `${cSize * 0.7}px`,
        top: `${playerPos.y * cSize + cSize * 0.15}px`, left: `${playerPos.x * cSize + cSize * 0.15}px`
    }), [playerPos, cSize]);

    const goalStyle = useMemo<React.CSSProperties>(() => ({
        width: `${cSize * 0.8}px`, height: `${cSize * 0.8}px`,
        top: `${goalPos.y * cSize + cSize * 0.1}px`, left: `${goalPos.x * cSize + cSize * 0.1}px`
    }), [goalPos, cSize]);

    return (
        <div className="game-screen" ref={containerRef}>
            <div className="game-ui">
                <span>Level: {level}</span>
                <span>Time: {timer}s</span>
                <span style={{fontSize: '0.8em', color: '#888'}}>
                    P:({playerPos.x},{playerPos.y}) G:({goalPos.x},{goalPos.y})
                </span>
            </div>
            <div className="maze-container" style={mazeContainerStyle}>
                <div className="maze-grid-wrapper" style={mazeGridWrapperStyle}>
                     {maze.length > 0 && maze.map((row, y) => row.map((cell, x) => (
                        <div key={`${x}-${y}`} className={`maze-cell ${cell.top ? 'wall-top' : ''} ${cell.right ? 'wall-right' : ''} ${cell.bottom ? 'wall-bottom' : ''} ${cell.left ? 'wall-left' : ''}`}/>
                    )))}
                </div>
                <div className="player" style={playerStyle}></div>
                <div className="goal" style={goalStyle}></div>
                {movingWalls.map((wall) => (<div key={`wall-${wall.id}`} className="moving-wall" style={{ width: `${cSize}px`, height: `${cSize}px`, top: `${wall.y * cSize}px`, left: `${wall.x * cSize}px`}}/>))}
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---
interface MazeGameProps {
    onMazeComplete?: () => void; // Add prop for external completion handler
}

const MazeGame = ({ onMazeComplete }: MazeGameProps = {}) => {
    const [gameState, setGameState] = useState<'start' | 'game'>('start');

    const handleGameComplete = useCallback(async (fullMetrics: Record<string, any>, log: any[], diagnostics?: any) => {
        console.log(`🎮 handleGameComplete called!`);
        console.log(`📊 Full metrics:`, fullMetrics);
        console.log(`📝 Error log:`, log);
        
        // Still save the data to MongoDB but don't show report
        // setGameState('report'); // Remove this line
        const totalCollisions = Object.values(fullMetrics).reduce((acc: number, curr: any) => acc + curr.wallCollisions, 0);
        const totalShortest = Object.values(fullMetrics).reduce((acc: number, curr: any) => acc + curr.shortestPath, 0);
        const totalMoves = Object.values(fullMetrics).reduce((acc: number, curr: any) => acc + curr.moves, 0);
        const pathEfficiency = totalMoves > 0 ? totalShortest / totalMoves : 1;
        const motorControlScore = Math.max(0, 100 - totalCollisions * 5);
        const cognitiveLoadScore = Math.min(100, pathEfficiency * 100);
        const l2Metrics = fullMetrics[2] || { wallCollisions: 0 };
        const stressScore = Math.max(0, 100 - l2Metrics.wallCollisions * 8);
        const totalSharpTurns = Object.values(fullMetrics).reduce((acc: number, curr: any) => acc + curr.sharpTurns, 0);
        const stabilityScore = totalMoves > 0 ? Math.max(0, 100 - (totalSharpTurns / totalMoves) * 500) : 100;
        const neuroBalanceScore = (motorControlScore + cognitiveLoadScore + stressScore + stabilityScore) / 4;
        const scores = {
            motorControl: Math.round(motorControlScore), cognitiveLoad: Math.round(cognitiveLoadScore),
            stressManagement: Math.round(stressScore), behavioralStability: Math.round(stabilityScore),
            neuroBalance: Math.round(neuroBalanceScore)
        };
        const getRating = (score: number) => {
            if (score > 85) return "Excellent"; if (score > 70) return "Good"; if (score > 50) return "Average"; return "Needs Improvement";
        };
        const summary = [
            { metric: "Motor Control", rating: getRating(scores.motorControl), text: "Reflects precision and planning, measured by the number of wall collisions." },
            { metric: "Cognitive Load", rating: getRating(scores.cognitiveLoad), text: "Assesses spatial memory and problem-solving efficiency by comparing your path to the optimal route." },
            { metric: "Stress Management", rating: getRating(scores.stressManagement), text: "Gauges adaptability to dynamic and unpredictable challenges, such as moving walls." },
            { metric: "Behavioral Stability", rating: getRating(scores.behavioralStability), text: "Indicates calmness and deliberation, measured by analyzing erratic or sharp movements." },
            { metric: "NeuroBalance", rating: getRating(scores.neuroBalance), text: "An overall score reflecting a combination of all measured neurocognitive functions." }
        ];

        // Calculate total completion time
        const totalCompletionTime = Object.values(fullMetrics).reduce((acc: number, curr: any) => acc + (curr.completionTime || 0), 0);

        // Prepare game metrics
        const gameMetrics = {
            totalMoves,
            totalCollisions,
            completionTime: totalCompletionTime,
            pathEfficiency
        };

        console.log('Game completed. Processing data...');

        // Immediately trigger completion callback to ensure transition happens
        if (onMazeComplete) {
            console.log(`🚀 Calling onMazeComplete immediately...`);
            console.log(`🔍 onMazeComplete function:`, onMazeComplete);
            console.log(`🎯 Executing onMazeComplete now!`);
            try {
                onMazeComplete();
                console.log(`✅ onMazeComplete executed successfully!`);
            } catch (error) {
                console.error(`❌ Error calling onMazeComplete:`, error);
            }
        } else {
            console.warn(`⚠️ onMazeComplete is not defined!`);
        }

        // Save to MongoDB asynchronously (don't wait for it to complete the transition)
        const userId = localStorage.getItem('userId') || 'anonymous_' + Date.now();
        
        console.log('=== SAVING PERFORMANCE DATA TO MONGODB ===');
        console.log('User ID:', userId);
        console.log('Performance Log:', log);
        console.log('Scores:', scores);
        console.log('Game Metrics:', gameMetrics);
        
        // Save data asynchronously without blocking the transition
        (async () => {
            try {
                const reportPayload = {
                    userId,
                    gameType: 'neurobalance',
                    scores,
                    performanceLog: log,
                    gameMetrics,
                    summary,
                    aiAnalysis: "Analyzing your performance..."
                };
                
                console.log('Sending to backend:', reportPayload);
                
                const reportResponse = await fetch('http://localhost:5000/api/reports', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(reportPayload)
                });

                console.log('Backend response status:', reportResponse.status);
                
                if (reportResponse.ok) {
                    const reportResult = await reportResponse.json();
                    console.log('✅ Report saved successfully!');
                    console.log('Report ID:', reportResult.reportId);
                    console.log('Full response:', reportResult);
                } else {
                    const errorText = await reportResponse.text();
                    console.error('❌ Failed to save report:', errorText);
                }
            } catch (error) {
                console.error('❌ Error saving report to database:', error);
            }
        })();

                // Also save raw logs under the user's document (guestId or userId)
        (async () => {
            try {
                const guestId = localStorage.getItem('guestId');
                const userId = localStorage.getItem('userId');
                const sessionId = localStorage.getItem('gameSessionId') || null;

                // Build structured logs for every level/trial in fullMetrics
                const buildLevelEntry = (lvlNum: number, lvlMetrics: any) => {
                    const lvlStartMs = lvlMetrics.startTime || null;
                    const lvlCompletionMs = lvlMetrics.completionTime || null;
                    // Filter error log entries for this level
                    const lvlErrorLog = (log || []).filter((e: any) => e && e.level === lvlNum).map((e: any) => ({ ...e }));

                    // Collision events (wall collision and blocked by moving wall)
                    const collisionEvents = lvlErrorLog.filter((e: any) => e.event && /collision|blocked/i.test(e.event));
                    const collisionTimes = collisionEvents.map((ev: any) => new Date(ev.time).getTime()).sort((a: number, b: number) => a - b);

                    // collision spikes: sliding window of 10s with >=2 collisions
                    const collisionSpikes: any[] = [];
                    for (let i = 0; i < collisionTimes.length; i++) {
                        let j = i + 1;
                        while (j < collisionTimes.length && (collisionTimes[j] - collisionTimes[i]) <= 10000) j++;
                        const count = j - i;
                        if (count >= 2) {
                            collisionSpikes.push({ start: new Date(collisionTimes[i]).toISOString(), end: new Date(collisionTimes[j - 1]).toISOString(), count, events: collisionTimes.slice(i, j).map((t: number) => new Date(t).toISOString()) });
                        }
                    }

                    // Error clustering: group consecutive collisions separated by <=5s
                    const errorClusters: any[] = [];
                    if (collisionTimes.length > 0) {
                        let cluster = [collisionTimes[0]];
                        for (let k = 1; k < collisionTimes.length; k++) {
                            if ((collisionTimes[k] - collisionTimes[k - 1]) <= 5000) {
                                cluster.push(collisionTimes[k]);
                            } else {
                                errorClusters.push(cluster.map(t => new Date(t).toISOString()));
                                cluster = [collisionTimes[k]];
                            }
                        }
                        if (cluster.length) errorClusters.push(cluster.map(t => new Date(t).toISOString()));
                    }

                    // Idle events for this level
                    const idleEvents = ((diagnostics && diagnostics.idleSegments) || []).filter((s: any) => s.level === lvlNum).map((s: any) => ({ start: s.start, durationSec: s.durationSec }));

                    // Move timestamps that fall inside this level's timeframe
                    const movesForLevel = ((diagnostics && diagnostics.moveTimestamps) || []).filter((m: any) => {
                        if (!lvlStartMs) return true;
                        const t = m.time;
                        if (lvlCompletionMs) return t >= lvlStartMs && t <= (lvlStartMs + lvlCompletionMs);
                        return t >= lvlStartMs;
                    }).map((m: any) => ({ time: new Date(m.time).toISOString(), from: m.from, to: m.to, direction: m.direction }));

                    const pathDeviationRatio = (lvlMetrics.shortestPath && Array.isArray(lvlMetrics.path) && lvlMetrics.path.length > 0) ? (lvlMetrics.path.length / lvlMetrics.shortestPath) : null;

                    return {
                        level: lvlNum,
                        startTime: lvlMetrics.startTime || null,
                        decisionLatencyMs: lvlMetrics.decisionLatency || null,
                        completionTimeMs: lvlMetrics.completionTime || null,
                        moves: lvlMetrics.moves || 0,
                        wallCollisions: lvlMetrics.wallCollisions || 0,
                        sharpTurns: lvlMetrics.sharpTurns || 0,
                        microMovements: lvlMetrics.microMovements || 0,
                        path: lvlMetrics.path || [],
                        shortestPath: lvlMetrics.shortestPath || null,
                        pathDeviationRatio,
                        completionTimestamp: lvlMetrics.startTime ? new Date((lvlMetrics.startTime || 0) + (lvlMetrics.completionTime || 0)).toISOString() : null,
                        errorLog: lvlErrorLog,
                        collisionSpikes,
                        errorClusters,
                        idleEvents,
                        jitter: { sharpTurns: lvlMetrics.sharpTurns || 0, microMovements: lvlMetrics.microMovements || 0 },
                        decisionLatency: lvlMetrics.decisionLatency || null,
                        moveTimestamps: movesForLevel,
                        inputMethod: (diagnostics && diagnostics.inputMethod) || 'unknown'
                    };
                };

                const levelLogs: any[] = [];
                Object.keys(fullMetrics || {}).forEach(k => {
                    const n = Number(k);
                    const lm = fullMetrics[n];
                    if (lm) levelLogs.push(buildLevelEntry(n, lm));
                });

                const logsPayload = {
                    gameKey: 'maze',
                    logs: levelLogs,
                    sessionId,
                    guestId: guestId || null,
                    userId: userId || null
                };

                console.log('📤 Sending raw maze logs to /api/logs', logsPayload);
                try { console.log('[DEBUG] /api/logs payload (maze):', JSON.stringify(logsPayload).slice(0,2000)); } catch (e) {}

                const logsResp = await fetch('http://localhost:5000/api/logs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(logsPayload)
                });

                if (!logsResp.ok) {
                    console.error('❌ Failed to save raw maze logs', await logsResp.text());
                } else {
                    const lr = await logsResp.json();
                    console.log('✅ Raw maze logs saved:', lr);
                }
            } catch (err) {
                console.error('❌ Error sending raw maze logs:', err);
            }
        })();

        // Generate AI Analysis in background (also async)
        (async () => {
            try {
                const systemPrompt = "You are a neurocognitive performance analyst. Your task is to analyze a user's performance in a maze game and provide a detailed, constructive report. First, compare the user's scores against general population benchmarks for similar computer-based cognitive tasks. Second, specifically identify any scores that are 'Average' or 'Needs Improvement' as 'risk flags' and explain what gameplay patterns from the error log might have contributed to them. Third, analyze the precise, real-time timestamps in the error log to identify behavioral patterns like error clustering (multiple mistakes in a short period), hesitation, or difficulty adapting after a specific event. Your feedback should be encouraging, professional, and presented in 3-4 clear paragraphs. Address the user directly. Do not mention that you are an AI.";
                const userQuery = `Analyze the following user performance data from the NeuroBalance Maze game and provide your detailed, comparative feedback. Please find and use normative data for cognitive tests as a baseline for comparison.\n\nScores:\n${JSON.stringify(scores, null, 2)}\n\nError Log (with real-time timestamps):\n${JSON.stringify(log, null, 2)}`;
                const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
                if (!apiKey) {
                    console.log("AI Analysis is disabled. API key not configured.");
                    return;
                }
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
                const payload = {
                    contents: [{ parts: [{ text: userQuery }] }],
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    tools: [{ "google_search": {} }],
                };
                const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (!response.ok) throw new Error(`API call failed with status: ${response.status}`);
                const result = await response.json();
                const analysisText = result.candidates[0].content.parts[0].text;
                console.log('AI Analysis generated:', analysisText);

                // Update the saved report with AI analysis
                try {
                    await fetch('http://localhost:5000/api/reports', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            userId,
                            scores,
                            performanceLog: log,
                            gameMetrics,
                            summary,
                            aiAnalysis: analysisText
                        })
                    });
                } catch (updateError) {
                    console.error('Error updating report with AI analysis:', updateError);
                }
            } catch (error) {
                console.error("AI Analysis Error:", error);
            }
        })();
    }, [onMazeComplete]);

    return (
        <div className={`app-container ${gameState !== 'game' ? 'center-content' : ''} gradient-bg`}>
            <GlobalStyles />
            <MazeParticleBackground />
            {gameState === 'start' && <StartScreen onStart={async () => {
                try {
                    const guestId = localStorage.getItem('guestId');
                    const userId = localStorage.getItem('userId');
                    const payload: any = { checkOnly: true };
                    if (userId) payload.userId = userId; else if (guestId) payload.guestId = guestId;
                    const resp = await fetch('http://localhost:5000/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    if (resp.ok) {
                        // create a start session on backend so session.isStart is recorded
                        try {
                            const guestId = localStorage.getItem('guestId');
                            const userId = localStorage.getItem('userId');
                            const startPayload: any = { start: true };
                            if (userId) startPayload.userId = userId; else if (guestId) startPayload.guestId = guestId;
                            startPayload.gameKey = 'maze';
                            const startResp = await fetch('http://localhost:5000/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(startPayload) });
                            if (startResp.ok) {
                                const jr = await startResp.json().catch(() => null);
                                if (jr && jr.sessionId) localStorage.setItem('gameSessionId', jr.sessionId);
                                if (jr && jr.sessionNumber) localStorage.setItem('gameSessionNumber', String(jr.sessionNumber));
                            }
                        } catch (e) { console.warn('Failed to create session on start (maze):', e); }
                        setGameState('game');
                    } else {
                        const txt = await resp.json().catch(() => ({}));
                        const msg = txt && txt.message ? txt.message : 'You are not allowed to play at this time.';
                        const next = txt && txt.nextAllowedAt ? ` Next allowed at: ${txt.nextAllowedAt}` : '';
                        alert(msg + next);
                    }
                } catch (err) {
                    console.error('Play availability check failed, starting anyway:', err);
                    setGameState('game');
                }
            }} />}
            {gameState === 'game' && <GameScreen onGameComplete={handleGameComplete} />}
        </div>
    );
};

export default MazeGame;
/// <reference types="socket.io-client" />

type PlayerSide = 'left' | 'right' | null;

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Paddle {
  y: number;
  score: number;
}

interface GameState {
  ball: Ball;
  paddles: {
    left: Paddle;
    right: Paddle;
  };
  gameWidth: number;
  gameHeight: number;
  paddleHeight: number;
  paddleWidth: number;
}

declare namespace SocketIOClient {
  interface Socket {
    id: string;
    on(event: string, callback: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): this;
    disconnect(): this;
  }
}

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const socket: SocketIOClient.Socket = io();

let playerSide: PlayerSide = null;
let gameState: GameState | null = null;

// Socket event listeners
socket.on('playerAssigned', (side: PlayerSide) => {
    playerSide = side;
    (document.getElementById('playerSide') as HTMLElement).textContent = `You are: ${side?.toUpperCase()} paddle`;
    (document.getElementById('status') as HTMLElement).textContent = 'Waiting for another player...';
    (document.getElementById('status') as HTMLElement).className = 'status';
});

socket.on('gameUpdate', (state: GameState) => {
    gameState = state;
    updateUI();
    draw();
});

socket.on('gameFull', () => {
    (document.getElementById('status') as HTMLElement).textContent = 'Game is full! Please try again later.';
    (document.getElementById('status') as HTMLElement).className = 'status error';
});

socket.on('disconnect', () => {
    (document.getElementById('status') as HTMLElement).textContent = 'Disconnected from server';
    (document.getElementById('status') as HTMLElement).className = 'status error';
});

// Keyboard controls
const keys: Record<string, boolean> = {};

document.addEventListener('keydown', (e: KeyboardEvent) => {
    // Prevent scrolling for game controls
    if (["ArrowUp", "ArrowDown", "w", "W", "s", "S"].includes(e.key)) {
        e.preventDefault();
    }
    keys[e.key] = true;
    handleMovement();
});

document.addEventListener('keyup', (e: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "w", "W", "s", "S"].includes(e.key)) {
        e.preventDefault();
    }
    keys[e.key] = false;
});

function handleMovement() {
    if (!playerSide) return;

    if (keys['w'] || keys['W'] || keys['ArrowUp']) {
        socket.emit('paddleMove', 'up');
    }
    if (keys['s'] || keys['S'] || keys['ArrowDown']) {
        socket.emit('paddleMove', 'down');
    }
}

function updateUI() {
    if (!gameState) return;
    (document.getElementById('leftScore') as HTMLElement).textContent = String(gameState.paddles.left.score);
    (document.getElementById('rightScore') as HTMLElement).textContent = String(gameState.paddles.right.score);
    if (Object.keys(gameState).length > 0) {
        (document.getElementById('status') as HTMLElement).textContent = 'Game in progress!';
        (document.getElementById('status') as HTMLElement).className = 'status success';
    }
}

function draw() {
    if (!gameState) return;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = playerSide === 'left' ? '#ffd700' : '#fff';
    ctx.fillRect(0, gameState.paddles.left.y, gameState.paddleWidth, gameState.paddleHeight);

    ctx.fillStyle = playerSide === 'right' ? '#ffd700' : '#fff';
    ctx.fillRect(canvas.width - gameState.paddleWidth, gameState.paddles.right.y, gameState.paddleWidth, gameState.paddleHeight);

    // Draw ball
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2);
    ctx.fill();
}

// Initial canvas setup
ctx.fillStyle = '#000';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#fff';
ctx.font = '24px Arial';
ctx.textAlign = 'center';
ctx.fillText('Connecting...', canvas.width / 2, canvas.height / 2);

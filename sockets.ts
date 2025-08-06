import { Server as SocketIOServer, Socket } from 'socket.io';
import http from 'http';

// Game state types
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

type PlayerSide = 'left' | 'right';

let gameState: GameState = {
  ball: {
    x: 400,
    y: 300,
    vx: 5,
    vy: 3,
    radius: 10
  },
  paddles: {
    left: { y: 250, score: 0 },
    right: { y: 250, score: 0 }
  },
  gameWidth: 800,
  gameHeight: 600,
  paddleHeight: 100,
  paddleWidth: 10
};

let players: Record<string, PlayerSide> = {};
let gameInterval: NodeJS.Timeout | null = null;

export function initSockets(server: http.Server) {
  const io = new SocketIOServer(server);

  io.on('connection', (socket: Socket) => {
    console.log('Player connected:', socket.id);

    // Assign player to left or right paddle
    if (Object.keys(players).length === 0) {
      players[socket.id] = 'left';
      socket.emit('playerAssigned', 'left');
    } else if (Object.keys(players).length === 1) {
      players[socket.id] = 'right';
      socket.emit('playerAssigned', 'right');
      startGame(io); // Start game when 2 players connect
    } else {
      socket.emit('gameFull');
      socket.disconnect();
      return;
    }

    // Handle paddle movement
    socket.on('paddleMove', (direction: 'up' | 'down') => {
      const playerSide = players[socket.id];
      if (playerSide === 'left') {
        if (direction === 'up' && gameState.paddles.left.y > 0) {
          gameState.paddles.left.y -= 20;
        } else if (direction === 'down' && gameState.paddles.left.y < gameState.gameHeight - gameState.paddleHeight) {
          gameState.paddles.left.y += 20;
        }
      } else if (playerSide === 'right') {
        if (direction === 'up' && gameState.paddles.right.y > 0) {
          gameState.paddles.right.y -= 20;
        } else if (direction === 'down' && gameState.paddles.right.y < gameState.gameHeight - gameState.paddleHeight) {
          gameState.paddles.right.y += 20;
        }
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
      delete players[socket.id];
      if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
      }
      // Reset game state
      resetGame();
    });
  });
}

function startGame(io: SocketIOServer) {
  if (gameInterval) return;

  gameInterval = setInterval(() => {
    updateGame();
    io.emit('gameUpdate', gameState);
  }, 1000 / 60); // 60 FPS
}

function updateGame() {
  // Move ball
  gameState.ball.x += gameState.ball.vx;
  gameState.ball.y += gameState.ball.vy;

  // Ball collision with top and bottom walls
  if (gameState.ball.y <= gameState.ball.radius || gameState.ball.y >= gameState.gameHeight - gameState.ball.radius) {
    gameState.ball.vy = -gameState.ball.vy;
  }

  // Ball collision with paddles
  // Left paddle
  if (
    gameState.ball.x <= gameState.paddleWidth + gameState.ball.radius &&
    gameState.ball.y >= gameState.paddles.left.y &&
    gameState.ball.y <= gameState.paddles.left.y + gameState.paddleHeight
  ) {
    gameState.ball.vx = -gameState.ball.vx;
    gameState.ball.x = gameState.paddleWidth + gameState.ball.radius;
  }

  // Right paddle
  if (
    gameState.ball.x >= gameState.gameWidth - gameState.paddleWidth - gameState.ball.radius &&
    gameState.ball.y >= gameState.paddles.right.y &&
    gameState.ball.y <= gameState.paddles.right.y + gameState.paddleHeight
  ) {
    gameState.ball.vx = -gameState.ball.vx;
    gameState.ball.x = gameState.gameWidth - gameState.paddleWidth - gameState.ball.radius;
  }

  // Ball out of bounds (scoring)
  if (gameState.ball.x <= 0) {
    gameState.paddles.right.score++;
    resetBall();
  } else if (gameState.ball.x >= gameState.gameWidth) {
    gameState.paddles.left.score++;
    resetBall();
  }
}

function resetBall() {
  gameState.ball.x = gameState.gameWidth / 2;
  gameState.ball.y = gameState.gameHeight / 2;
  gameState.ball.vx = Math.random() > 0.5 ? 5 : -5;
  gameState.ball.vy = Math.random() * 6 - 3;
}

function resetGame() {
  gameState.ball.x = 400;
  gameState.ball.y = 300;
  gameState.ball.vx = 5;
  gameState.ball.vy = 3;
  gameState.paddles.left.y = 250;
  gameState.paddles.right.y = 250;
  gameState.paddles.left.score = 0;
  gameState.paddles.right.score = 0;
}
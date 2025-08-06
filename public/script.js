/// <reference types="socket.io-client" />
var canvas = document.getElementById('gameCanvas');
var ctx = canvas.getContext('2d');
var socket = io();
var playerSide = null;
var gameState = null;
// Socket event listeners
socket.on('playerAssigned', function (side) {
    playerSide = side;
    document.getElementById('playerSide').textContent = "You are: ".concat(side === null || side === void 0 ? void 0 : side.toUpperCase(), " paddle");
    document.getElementById('status').textContent = 'Waiting for another player...';
    document.getElementById('status').className = 'status';
});
socket.on('gameUpdate', function (state) {
    gameState = state;
    updateUI();
    draw();
});
socket.on('gameFull', function () {
    document.getElementById('status').textContent = 'Game is full! Please try again later.';
    document.getElementById('status').className = 'status error';
});
socket.on('disconnect', function () {
    document.getElementById('status').textContent = 'Disconnected from server';
    document.getElementById('status').className = 'status error';
});
// Keyboard controls
var keys = {};
document.addEventListener('keydown', function (e) {
    // Prevent scrolling for game controls
    if (["ArrowUp", "ArrowDown", "w", "W", "s", "S"].includes(e.key)) {
        e.preventDefault();
    }
    keys[e.key] = true;
    handleMovement();
});
document.addEventListener('keyup', function (e) {
    if (["ArrowUp", "ArrowDown", "w", "W", "s", "S"].includes(e.key)) {
        e.preventDefault();
    }
    keys[e.key] = false;
});
function handleMovement() {
    if (!playerSide)
        return;
    if (keys['w'] || keys['W'] || keys['ArrowUp']) {
        socket.emit('paddleMove', 'up');
    }
    if (keys['s'] || keys['S'] || keys['ArrowDown']) {
        socket.emit('paddleMove', 'down');
    }
}
function updateUI() {
    if (!gameState)
        return;
    document.getElementById('leftScore').textContent = String(gameState.paddles.left.score);
    document.getElementById('rightScore').textContent = String(gameState.paddles.right.score);
    if (Object.keys(gameState).length > 0) {
        document.getElementById('status').textContent = 'Game in progress!';
        document.getElementById('status').className = 'status success';
    }
}
function draw() {
    if (!gameState)
        return;
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

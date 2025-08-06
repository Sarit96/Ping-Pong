import express, { Express } from 'express';
import http from 'http';
import path from 'path';
import { AddressInfo } from 'net';
import { initSockets } from './sockets';

const app: Express = express();
const server = http.createServer(app);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Initialize socket.io logic
initSockets(server);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

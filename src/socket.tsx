import { io, Socket } from 'socket.io-client';

// Define custom properties for the Socket instance
export interface CustomSocket extends Socket {
  auth?: {
    sessionID?: string;
    username?: string;
    name?: string;
    userId?: string;
    token?: string;
  };
  userID?: string;
}

const URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Cast the socket to our custom interface
const socket: CustomSocket = io(URL, {
  autoConnect: false,
  reconnectionAttempts: 5,
  timeout: 10000,
});

if (import.meta.env.DEV) {
  socket.onAny((event, ...args) => console.log(event, args));
}

export default socket;

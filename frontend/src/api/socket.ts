import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const socket = io(URL, {
    autoConnect: true,
    transports: ['websocket', 'polling'], // Fallback to polling is automatic in Socket.IO
});

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import showRoutes from './controllers/shows.controller';
import bookingRoutes from './controllers/bookings.controller';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: '*', // Allow all origins for simplicity (or configure specific frontend URL)
        methods: ['GET', 'POST']
    }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

import authRoutes from './controllers/auth.controller';
import adminRoutes from './controllers/admin.controller';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);

import './workers/expiry.worker';

// Swagger
const swaggerDocument = YAML.load(path.join(process.cwd(), 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

export { app, io };

if (require.main === module) {
    httpServer.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

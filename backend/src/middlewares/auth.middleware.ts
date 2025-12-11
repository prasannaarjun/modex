import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload, UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Extend Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: AuthTokenPayload;
        }
    }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user as AuthTokenPayload;
        next();
    });
};

export const requireRole = (role: UserRole) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ error: 'User not authenticated' });

        if (req.user.role !== role) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

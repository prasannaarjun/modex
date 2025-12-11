import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { z } from 'zod';
import { UserRole } from '../types';

const router = Router();
const authService = new AuthService();

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    role: z.nativeEnum(UserRole).optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

router.post('/register', async (req: Request, res: Response) => {
    try {
        const validated = registerSchema.parse(req.body);
        const result = await authService.register(validated);
        res.status(201).json(result);
    } catch (err: any) {
        if (err instanceof z.ZodError) return res.status(422).json({ error: err.errors });
        if (err.message === 'User already exists') return res.status(409).json({ error: err.message });
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/login', async (req: Request, res: Response) => {
    try {
        const validated = loginSchema.parse(req.body);
        const result = await authService.login(validated);
        res.json(result);
    } catch (err: any) {
        if (err instanceof z.ZodError) return res.status(422).json({ error: err.errors });
        if (err.message === 'Invalid credentials') return res.status(401).json({ error: err.message });
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;

import { Router, Request, Response } from 'express';
import { TheaterService } from '../services/theater.service';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '../types';
import { z } from 'zod';

const router = Router();
const theaterService = new TheaterService();

const onboardSchema = z.object({
    name: z.string().min(1),
    street: z.string().min(1),
    area: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().min(1),
});

// POST /api/admin/onboard
router.post('/onboard', authenticateToken, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const validated = onboardSchema.parse(req.body);
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const theater = await theaterService.onboardAdmin(req.user.userId, validated);
        res.status(201).json(theater);
    } catch (err: any) {
        if (err instanceof z.ZodError) return res.status(422).json({ error: err.errors });
        if (err.message === 'Admin already onboarded') return res.status(409).json({ error: err.message });
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;

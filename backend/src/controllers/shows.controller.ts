import { Router, Request, Response } from 'express';
import { ShowService } from '../services/show.service';
import { BookingService } from '../services/booking.service';
import { z } from 'zod';

const router = Router();
const showService = new ShowService();
const bookingService = new BookingService();

// Validation schemas
const createShowSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    start_time: z.string().datetime(),
    total_seats: z.number().int().positive(),
    price1: z.number().int().positive(),
    price2: z.number().int().positive(),
    price3: z.number().int().positive(),
});

// GET /api/shows
router.get('/', async (req: Request, res: Response) => {
    try {
        const shows = await showService.getAllShows();
        res.json(shows);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/shows/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

        const show = await showService.getShowById(id);
        if (!show) return res.status(404).json({ error: 'Show not found' });

        res.json(show);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

import { authenticateToken, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '../types';

// ... (imports)

// POST /api/shows (Admin)
router.post('/', authenticateToken, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const validated = createShowSchema.parse(req.body);
        const show = await showService.createShow(validated);
        res.status(201).json(show);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(422).json({ error: err.errors });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Validation for booking
const bookShowSchema = z.object({
    seatIds: z.array(z.number().int().positive()).min(1)
});

// POST /api/shows/:id/book (Authenticated User)
router.post('/:id/book', authenticateToken, async (req: Request, res: Response) => {
    try {
        const showId = parseInt(req.params.id);
        if (isNaN(showId)) return res.status(400).json({ error: 'Invalid ID' });

        // Validate body
        const { seatIds } = bookShowSchema.parse(req.body);

        // Spec: Create booking -> insert PENDING
        if (!req.user) throw new Error("User not found in request");
        const booking = await bookingService.createBooking(showId, req.user.userId, seatIds);
        res.json(booking);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return res.status(422).json({ error: err.errors });
        }
        if (err.message === 'No seats available') {
            return res.status(409).json({ error: 'No seats available' });
        }
        if (err.message.includes('not available') || err.message.includes('not found')) { // Handle specific seat errors
            return res.status(409).json({ error: err.message });
        }
        if (err.message === 'Show not found') {
            return res.status(404).json({ error: 'Show not found' });
        }
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;

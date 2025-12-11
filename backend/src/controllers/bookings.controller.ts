import { Router, Request, Response } from 'express';
import { BookingService } from '../services/booking.service';

const router = Router();
const bookingService = new BookingService();

// GET /api/bookings/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

        const booking = await bookingService.getBooking(id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        res.json(booking);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/bookings/:id/confirm
router.post('/:id/confirm', async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

        const booking = await bookingService.confirmBooking(id);
        res.json(booking);
    } catch (err: any) {
        if (err.message === 'Booking not found') return res.status(404).json({ error: 'Booking not found' });
        if (err.message === 'Booking expired') return res.status(409).json({ error: 'Booking expired' });
        if (err.message.startsWith('Booking is')) return res.status(409).json({ error: err.message });

        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;

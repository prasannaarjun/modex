import { BookingRepository } from '../repositories/booking.repository';
import { addExpiryJob } from './queue.service';

export class BookingService {
    private repo: BookingRepository;

    constructor() {
        this.repo = new BookingRepository();
    }

    async createBooking(showId: number, userId: number) {
        // 1. Create booking in DB (atomic check logic in repo)
        const booking = await this.repo.createBooking(showId, userId);

        // 2. Schedule expiry job
        // Calculate delay: expires_at - now. Ideally passed from DB or fixed 2 min.
        // Repo sets it to 2 mins from now.
        const delay = 2 * 60 * 1000;

        // Non-blocking add to queue (or blocking if strict, but queue failure shouldn't rollback booking necessarily? 
        // Ideally it should. If job fails to schedule, we might want to fail booking. 
        // But BullMQ add is fast. Let's await it.)
        try {
            await addExpiryJob(booking.id, delay);
        } catch (err) {
            console.error('Failed to schedule expiry job', err);
            // If we can't schedule expiry, the poller (if any) or fallback should handle it. 
            // Or we rollback? For simplicity, we log.
        }

        return booking;
    }

    async confirmBooking(bookingId: number) {
        return this.repo.confirmBooking(bookingId);
    }

    async getBooking(id: number) {
        return this.repo.findById(id);
    }
}

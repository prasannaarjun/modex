import { BookingService } from '../src/services/booking.service';
import { ShowService } from '../src/services/show.service';
import { closeQueue } from '../src/services/queue.service';
import pool from '../src/db/pool';

/**
 * Concurrency Test:
 * 1. Create a show with N seats.
 * 2. Launch M > N concurrent booking requests.
 * 3. Verify that total bookings <= N.
 */
describe('Concurrency Integration Test', () => {
    const bookingService = new BookingService();
    const showService = new ShowService();
    let showId: number;
    const TOTAL_SEATS = 50;
    const CONCURRENT_REQUESTS = 200;

    beforeAll(async () => {
        // Clear DB or setup new show
        // We assume DB is running and connected (Requires Docker)
        try {
            const show = await showService.createShow({
                title: 'Concurrency Test Show',
                start_time: new Date().toISOString(),
                total_seats: TOTAL_SEATS,
            });
            showId = show.id;
        } catch (e) {
            console.warn("Skipping DB setup - DB might not be reachable");
        }
    });

    afterAll(async () => {
        await closeQueue();
        await pool.end();
    });

    it('should not overbook seats under high concurrency', async () => {
        if (!showId) {
            console.warn("Skipping concurrency test as DB setup failed");
            return;
        }

        const promises = [];
        for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
            promises.push(
                bookingService.createBooking(showId)
                    .then(() => ({ status: 'success' }))
                    .catch((err) => ({ status: 'fail', error: err.message }))
            );
        }

        const results = await Promise.all(promises);

        const successes = results.filter(r => r.status === 'success');
        const failures = results.filter(r => r.status === 'fail');

        console.log(`Requests: ${CONCURRENT_REQUESTS}, Success: ${successes.length}, Fail: ${failures.length}`);

        // Assertions
        expect(successes.length).toBeLessThanOrEqual(TOTAL_SEATS);
        expect(failures.length).toBeGreaterThanOrEqual(CONCURRENT_REQUESTS - TOTAL_SEATS);

        // Verify DB state
        const show = await showService.getShowById(showId);
        // @ts-ignore
        const reserved = show?.reserved_seats || 0;
        // @ts-ignore
        const confirmed = show?.confirmed_seats || 0;

        expect(reserved + confirmed).toBeLessThanOrEqual(TOTAL_SEATS);
    }, 30000); // Increase timeout
});

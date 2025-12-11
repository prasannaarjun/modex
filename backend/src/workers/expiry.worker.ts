import { Worker } from 'bullmq';
import dotenv from 'dotenv';
import { BookingRepository } from '../repositories/booking.repository';

dotenv.config();

const connection = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

const bookingRepo = new BookingRepository();

const worker = new Worker(
    'booking-expiry',
    async (job) => {
        const { bookingId } = job.data;
        console.log(`Processing expiry for booking ${bookingId}`);
        try {
            await bookingRepo.expireBooking(bookingId);
            console.log(`Expired booking ${bookingId}`);
        } catch (err) {
            console.error(`Failed to expire booking ${bookingId}`, err);
            throw err;
        }
    },
    { connection }
);

worker.on('completed', (job) => {
    console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} has failed with ${err.message}`);
});

console.log('Expiry worker started...');

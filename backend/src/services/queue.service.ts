import { Queue } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

const connection = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const expiryQueue = new Queue('booking-expiry', { connection });

export const addExpiryJob = async (bookingId: number, delayMs: number) => {
    await expiryQueue.add('expire-booking', { bookingId }, { delay: delayMs });
    console.log(`Scheduled expiry for booking ${bookingId} in ${delayMs}ms`);
};

export const closeQueue = async () => {
    await expiryQueue.close();
};

import { PoolClient } from 'pg';
import { getClient } from '../db/pool';
import { Booking, BookingStatus } from '../types';

export class BookingRepository {
  /**
   * Creates a booking TRANSACTIONALLY.
   * Lock strategy: SELECT ... FOR UPDATE on show_inventory
   */
  async createBooking(showId: number): Promise<Booking> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Lock inventory row
      const inventoryQuery = `
        SELECT total_seats, reserved_seats, confirmed_seats
        FROM show_inventory
        WHERE show_id = $1
        FOR UPDATE
      `;
      const invRes = await client.query(inventoryQuery, [showId]);

      if (invRes.rows.length === 0) {
        throw new Error('Show not found');
      }

      const inv = invRes.rows[0];
      const available = inv.total_seats - inv.reserved_seats - inv.confirmed_seats;

      if (available <= 0) {
        throw new Error('No seats available');
      }

      // 2. Increment reserved
      await client.query(`
        UPDATE show_inventory
        SET reserved_seats = reserved_seats + 1
        WHERE show_id = $1
      `, [showId]);

      // 3. Create Booking
      const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
      const bookingRes = await client.query(`
        INSERT INTO bookings (show_id, status, expires_at)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [showId, BookingStatus.PENDING, expiresAt]);

      await client.query('COMMIT');
      return bookingRes.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async confirmBooking(bookingId: number): Promise<Booking> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Lock booking
      const bookingRes = await client.query(`
        SELECT * FROM bookings WHERE id = $1 FOR UPDATE
      `, [bookingId]);

      if (bookingRes.rows.length === 0) {
        throw new Error('Booking not found');
      }
      const booking = bookingRes.rows[0] as Booking;

      if (booking.status !== BookingStatus.PENDING) {
        throw new Error(`Booking is ${booking.status}`);
      }

      const now = new Date();
      if (booking.expires_at && new Date(booking.expires_at) < now) {
        // Technically this should be handled by expiry worker, but fail here too
        // We should set it to expired if we catch it here?
        // Let's just fail confirm.
        throw new Error('Booking expired');
      }

      // 2. Update booking status
      const updatedBookingRes = await client.query(`
        UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *
        `, [BookingStatus.CONFIRMED, bookingId]);

      // 3. Update inventory (Decrement reserved, increment confirmed)
      await client.query(`
        UPDATE show_inventory
        SET reserved_seats = reserved_seats - 1,
          confirmed_seats = confirmed_seats + 1
        WHERE show_id = $1
          `, [booking.show_id]);

      await client.query('COMMIT');
      return updatedBookingRes.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async findById(id: number): Promise<Booking | null> {
    const client = await getClient();
    try {
      const res = await client.query('SELECT * FROM bookings WHERE id = $1', [id]);
      return res.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // For worker
  async findExpiredPendingBookings(): Promise<Booking[]> {
    const client = await getClient();
    try {
      const res = await client.query(`
         SELECT * FROM bookings 
         WHERE status = $1 AND expires_at < NOW()
         LIMIT 100
          `, [BookingStatus.PENDING]);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async expireBooking(bookingId: number): Promise<void> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const bookingRes = await client.query('SELECT * FROM bookings WHERE id = $1 FOR UPDATE', [bookingId]);
      const booking = bookingRes.rows[0] as Booking;

      if (!booking || booking.status !== BookingStatus.PENDING) {
        await client.query('COMMIT'); // Already processed
        return;
      }

      await client.query('UPDATE bookings SET status = $1 WHERE id = $2', [BookingStatus.EXPIRED, bookingId]);

      await client.query(`
        UPDATE show_inventory 
        SET reserved_seats = reserved_seats - 1
        WHERE show_id = $1
          `, [booking.show_id]);

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

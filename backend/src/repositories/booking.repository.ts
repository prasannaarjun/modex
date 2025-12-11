import { prisma } from '../db/prisma';
import { Booking, BookingStatus } from '../types';

type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class BookingRepository {
  async createBooking(showId: number, userId: number, seatIds: number[]): Promise<Booking> {
    return prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Validate and Lock Seats
      // sorting to avoid deadlocks
      const sortedIds = [...seatIds].sort((a, b) => a - b);

      const seats = await tx.seat.findMany({
        where: {
          id: { in: sortedIds },
          show_id: showId
        }
      });

      if (seats.length !== seatIds.length) {
        throw new Error('Some seats not found');
      }

      for (const seat of seats) {
        if (seat.status !== 'AVAILABLE' || seat.booking_id) {
          throw new Error(`Seat ${seat.id} is not available`);
        }
      }

      // 2. Create Booking
      const booking = await tx.booking.create({
        data: {
          show_id: showId,
          user_id: userId,
          status: 'PENDING',
          expires_at: new Date(Date.now() + 2 * 60 * 1000)
        }
      });

      // 3. Update Seats
      await tx.seat.updateMany({
        where: { id: { in: sortedIds } },
        data: {
          booking_id: booking.id,
          status: 'LOCKED'
        }
      });

      // 4. Update Inventory Stats (Legacy support + stats)
      await tx.showInventory.update({
        where: { show_id: showId },
        data: {
          reserved_seats: { increment: seatIds.length }
        }
      });

      return {
        id: booking.id,
        show_id: booking.show_id,
        user_id: booking.user_id || 0,
        status: booking.status as BookingStatus,
        expires_at: booking.expires_at as Date,
        created_at: booking.created_at
      };
    });
  }

  async confirmBooking(bookingId: number): Promise<Booking> {
    return prisma.$transaction(async (tx: TransactionClient) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { seats: true }
      });

      if (!booking) throw new Error('Booking not found');
      if (booking.status !== 'PENDING') throw new Error('Booking not pending');

      if (booking.expires_at && new Date() > booking.expires_at) {
        throw new Error('Booking expired');
      }

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' }
      });

      // Update Seats to BOOKED
      await tx.seat.updateMany({
        where: { booking_id: bookingId },
        data: { status: 'BOOKED' }
      });

      // Update Stats
      const seatCount = booking.seats.length;
      await tx.showInventory.update({
        where: { show_id: booking.show_id },
        data: {
          reserved_seats: { decrement: seatCount },
          confirmed_seats: { increment: seatCount }
        }
      });

      return {
        id: updated.id,
        show_id: updated.show_id,
        user_id: updated.user_id || 0,
        status: updated.status as BookingStatus,
        expires_at: updated.expires_at as Date,
        created_at: updated.created_at
      };
    });
  }

  async expireBooking(bookingId: number): Promise<void> {
    await prisma.$transaction(async (tx: TransactionClient) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { seats: true }
      });

      if (!booking || booking.status !== 'PENDING') return;

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'EXPIRED' }
      });

      // Release Seats
      await tx.seat.updateMany({
        where: { booking_id: bookingId },
        data: {
          status: 'AVAILABLE',
          booking_id: null
        }
      });

      // Update Stats
      const seatCount = booking.seats.length;
      await tx.showInventory.update({
        where: { show_id: booking.show_id },
        data: {
          reserved_seats: { decrement: seatCount }
        }
      });
    });
  }

  async findById(bookingId: number): Promise<Booking | null> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) return null;

    return {
      id: booking.id,
      show_id: booking.show_id,
      user_id: booking.user_id || 0,
      status: booking.status as BookingStatus,
      expires_at: booking.expires_at as Date,
      created_at: booking.created_at
    };
  }

  async findByUserId(userId: number): Promise<Booking[]> {
    const bookings = await prisma.booking.findMany({
      where: { user_id: userId },
      include: { show: true },
      orderBy: { created_at: 'desc' }
    });

    return bookings.map((b: any) => ({
      id: b.id,
      show_id: b.show_id,
      user_id: b.user_id,
      status: b.status as BookingStatus,
      expires_at: b.expires_at,
      created_at: b.created_at,
      show: b.show ? {
        id: b.show.id,
        title: b.show.title,
        start_time: b.show.start_time
      } : undefined
    }));
  }
}

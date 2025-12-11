import { prisma } from '../db/prisma';
import { Booking, BookingStatus } from '../types';

type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class BookingRepository {
  async createBooking(showId: number, userId: number): Promise<Booking> {
    return prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Lock Inventory Row
      const inventory = await tx.$queryRaw`
                SELECT * FROM show_inventory 
                WHERE show_id = ${showId} 
                FOR UPDATE
            ` as any[];

      if (!inventory || inventory.length === 0) {
        throw new Error('Show not found');
      }

      const inv = inventory[0];
      const available = inv.total_seats - (inv.reserved_seats + inv.confirmed_seats);

      if (available <= 0) {
        throw new Error('No seats available');
      }

      // 2. Initial Booking
      const booking = await tx.booking.create({
        data: {
          show_id: showId,
          user_id: userId,
          status: 'PENDING',
          expires_at: new Date(Date.now() + 2 * 60 * 1000)
        }
      });

      // 3. Update Inventory
      await tx.showInventory.update({
        where: { show_id: showId },
        data: {
          reserved_seats: { increment: 1 }
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
        where: { id: bookingId }
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

      await tx.showInventory.update({
        where: { show_id: booking.show_id },
        data: {
          reserved_seats: { decrement: 1 },
          confirmed_seats: { increment: 1 }
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
        where: { id: bookingId }
      });

      if (!booking || booking.status !== 'PENDING') return;

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'EXPIRED' }
      });

      await tx.showInventory.update({
        where: { show_id: booking.show_id },
        data: {
          reserved_seats: { decrement: 1 }
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
}

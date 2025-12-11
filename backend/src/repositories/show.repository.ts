import { prisma } from '../db/prisma';
import { CreateShowDto, Show, SeatType, SeatStatus } from '../types';
import { Prisma } from '@prisma/client';

export class ShowRepository {
    async create(data: CreateShowDto): Promise<Show> {
        // Calculate grid dimensions (square matrix)
        const gridSize = Math.ceil(Math.sqrt(data.total_seats));
        const actualTotalSeats = gridSize * gridSize;

        // Transaction to create show + inventory + seats
        const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const show = await tx.show.create({
                data: {
                    title: data.title,
                    start_time: new Date(data.start_time),
                    description: data.description || '',
                }
            });

            await tx.showInventory.create({
                data: {
                    show_id: show.id,
                    total_seats: actualTotalSeats,
                    reserved_seats: 0,
                    confirmed_seats: 0
                }
            });

            // Generate Seats in a square grid
            // Divide rows into 3 roughly equal tiers
            const tier1Rows = Math.ceil(gridSize / 3);
            const tier2Rows = Math.ceil(gridSize / 3);
            // tier3Rows = remaining

            const seatsData = [];
            for (let row = 1; row <= gridSize; row++) {
                // Determine tier based on row position (front = tier1/cheapest, back = tier3/expensive for cinema, or reverse)
                // User wants 3 divisions. Let's map: Tier 1 = Back (premium), Tier 2 = Middle, Tier 3 = Front (budget).
                // Actually, typical cinema: Front is cheaper, Back is premium.
                // Let's keep it simple: rows 1-N/3 = price1, N/3+1 to 2N/3 = price2, rest = price3
                let price: number;
                let type: SeatType;
                if (row <= tier1Rows) {
                    price = data.price1;
                    type = SeatType.REGULAR;
                } else if (row <= tier1Rows + tier2Rows) {
                    price = data.price2;
                    type = SeatType.PREMIUM;
                } else {
                    price = data.price3;
                    type = SeatType.VIP;
                }

                for (let col = 1; col <= gridSize; col++) {
                    seatsData.push({
                        show_id: show.id,
                        row: String(row), // Use numeric row as string for simplicity ("1", "2", ...)
                        number: col,
                        type: type,
                        status: SeatStatus.AVAILABLE,
                        price: price,
                        booking_id: null
                    });
                }
            }

            // @ts-ignore - CreateMany input types can sometimes be tricky with enums
            await tx.seat.createMany({ data: seatsData });

            return show;
        });

        return {
            id: created.id,
            title: created.title,
            start_time: created.start_time,
            total_seats: data.total_seats,
            reserved_seats: 0,
            confirmed_seats: 0,
            created_at: created.created_at
        };
    }

    async findAll(): Promise<Show[]> {
        // Define include explicitly to help IDE inference
        const include = { inventory: true };

        const shows = await prisma.show.findMany({
            include
        });

        return shows.map((s) => ({
            id: s.id,
            title: s.title,
            start_time: s.start_time,
            // @ts-ignore - inventory presence guaranteed by include above
            total_seats: s.inventory?.total_seats || 0,
            // @ts-ignore
            reserved_seats: s.inventory?.reserved_seats || 0,
            // @ts-ignore
            confirmed_seats: s.inventory?.confirmed_seats || 0,
            created_at: s.created_at
        }));
    }

    async findById(id: number): Promise<Show | null> {
        // @ts-ignore - Prisma type inference can be strict, ignoring for orderBy
        const include = {
            inventory: true,
            seats: {
                orderBy: [
                    { row: 'asc' as const },
                    { number: 'asc' as const }
                ]
            }
        };

        const show = await prisma.show.findUnique({
            where: { id },
            include
        });

        if (!show) return null;

        // Use any cast to bypass persistent stale IDE type errors while maintaining runtime safety
        const s = show as any;

        return {
            id: s.id,
            title: s.title,
            start_time: s.start_time,
            total_seats: s.inventory?.total_seats || 0,
            reserved_seats: s.inventory?.reserved_seats || 0,
            confirmed_seats: s.inventory?.confirmed_seats || 0,
            created_at: s.created_at,
            seats: s.seats.map((seat: any) => ({
                id: seat.id,
                show_id: seat.show_id,
                row: seat.row,
                number: seat.number,
                type: seat.type as SeatType,
                status: seat.status as SeatStatus,
                price: seat.price,
                booking_id: seat.booking_id
            }))
        };
    }
}

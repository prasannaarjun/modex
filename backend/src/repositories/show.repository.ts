import { prisma } from '../db/prisma';
import { CreateShowDto, Show } from '../types';

type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class ShowRepository {
    async create(data: CreateShowDto): Promise<Show> {
        // Transaction to create show + inventory
        // Note: Raw PG used RETURNING * which returns the default values. Prisma create returns the object.
        const created = await prisma.$transaction(async (tx: TransactionClient) => {
            const show = await tx.show.create({
                data: {
                    title: data.title,
                    start_time: new Date(data.start_time),
                    description: '', // Schema allows null or default
                }
            });

            await tx.showInventory.create({
                data: {
                    show_id: show.id,
                    total_seats: data.total_seats,
                    reserved_seats: 0,
                    confirmed_seats: 0
                }
            });

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
        const shows = await prisma.show.findMany({
            include: { inventory: true }
        });

        return shows.map((s: typeof shows[number]) => ({
            id: s.id,
            title: s.title,
            start_time: s.start_time,
            total_seats: s.inventory?.total_seats || 0,
            reserved_seats: s.inventory?.reserved_seats || 0,
            confirmed_seats: s.inventory?.confirmed_seats || 0,
            created_at: s.created_at
        }));
    }

    async findById(id: number): Promise<Show | null> {
        const show = await prisma.show.findUnique({
            where: { id },
            include: { inventory: true }
        });

        if (!show) return null;

        return {
            id: show.id,
            title: show.title,
            start_time: show.start_time,
            total_seats: show.inventory?.total_seats || 0,
            reserved_seats: show.inventory?.reserved_seats || 0,
            confirmed_seats: show.inventory?.confirmed_seats || 0,
            created_at: show.created_at
        };
    }
}

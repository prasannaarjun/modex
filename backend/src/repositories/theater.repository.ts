import { prisma } from '../db/prisma';
import { Theater, CreateTheaterDto } from '../types/theater';

export class TheaterRepository {
    async create(userId: number, data: CreateTheaterDto): Promise<Theater> {
        const theater = await prisma.theater.create({
            data: {
                user_id: userId,
                name: data.name,
                street: data.street,
                area: data.area,
                city: data.city,
                state: data.state,
                country: data.country
            }
        });
        return theater;
    }

    async findByUserId(userId: number): Promise<Theater | null> {
        return prisma.theater.findUnique({
            where: { user_id: userId }
        });
    }
}

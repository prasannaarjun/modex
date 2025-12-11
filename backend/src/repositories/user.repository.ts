import { prisma } from '../db/prisma';
import { User, CreateUserDto, UserRole } from '../types';

export class UserRepository {
    async create(data: CreateUserDto): Promise<User> {
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password_hash: data.password,
                role: (data.role as 'user' | 'admin') || 'user',
            },
        });

        return {
            id: user.id,
            email: user.email,
            role: user.role as UserRole,
            created_at: user.created_at,
        };
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) return null;

        return {
            id: user.id,
            email: user.email,
            password_hash: user.password_hash,
            role: user.role as UserRole,
            created_at: user.created_at,
        };
    }

    async findById(id: number): Promise<User | null> {
        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) return null;

        return {
            id: user.id,
            email: user.email,
            role: user.role as UserRole,
            created_at: user.created_at,
        };
    }
}

import { TheaterRepository } from '../repositories/theater.repository';
import { CreateTheaterDto } from '../types/theater';

export class TheaterService {
    private repo: TheaterRepository;

    constructor() {
        this.repo = new TheaterRepository();
    }

    async onboardAdmin(userId: number, data: CreateTheaterDto) {
        const existing = await this.repo.findByUserId(userId);
        if (existing) {
            throw new Error('Admin already onboarded');
        }
        return this.repo.create(userId, data);
    }
}

import { ShowRepository } from '../repositories/show.repository';
import { CreateShowDto } from '../types';

export class ShowService {
    private repo: ShowRepository;

    constructor() {
        this.repo = new ShowRepository();
    }

    async getAllShows() {
        return this.repo.findAll();
    }

    async getShowById(id: number) {
        return this.repo.findById(id);
    }

    async createShow(data: CreateShowDto) {
        // Basic validation could go here
        return this.repo.create(data);
    }
}

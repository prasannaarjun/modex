import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { RegisterDto, LoginDto, UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export class AuthService {
    private userRepo: UserRepository;

    constructor() {
        this.userRepo = new UserRepository();
    }

    async register(data: RegisterDto) {
        const existing = await this.userRepo.findByEmail(data.email);
        if (existing) {
            throw new Error('User already exists');
        }

        const hash = await bcrypt.hash(data.password, 10);
        const user = await this.userRepo.create({ email: data.email, password: hash, role: data.role as string });
        return { id: user.id, email: user.email, role: user.role };
    }

    async login(data: LoginDto) {
        const user = await this.userRepo.findByEmail(data.email);
        if (!user || !user.password_hash) {
            throw new Error('Invalid credentials');
        }

        const match = await bcrypt.compare(data.password, user.password_hash);
        if (!match) {
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        return { token, user: { id: user.id, email: user.email, role: user.role } };
    }
}

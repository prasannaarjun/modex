export interface Show {
    id: number;
    title: string;
    description?: string;
    start_time: Date;
    created_at: Date;
    total_seats: number; // Added to match repository return
    reserved_seats: number;
    confirmed_seats: number;
    seats?: Seat[];
}

export interface ShowInventory {
    show_id: number;
    total_seats: number;
    reserved_seats: number;
    confirmed_seats: number;
}


export enum SeatType {
    REGULAR = 'REGULAR',
    PREMIUM = 'PREMIUM',
    VIP = 'VIP'
}

export enum SeatStatus {
    AVAILABLE = 'AVAILABLE',
    BOOKED = 'BOOKED',
    LOCKED = 'LOCKED'
}

export interface Seat {
    id: number;
    show_id: number;
    row: string;
    number: number;
    type: SeatType;
    status: SeatStatus;
    price: number;
    booking_id?: number | null;
}

export enum BookingStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    FAILED = 'FAILED',
    EXPIRED = 'EXPIRED',
}

export interface Booking {
    id: number;
    show_id: number;
    user_id: number;
    status: BookingStatus;
    expires_at: Date | null;
    created_at: Date;
}

export interface CreateShowDto {
    title: string;
    description?: string;
    start_time: string;
    total_seats: number;
    price1: number; // Front/Tier 1 price
    price2: number; // Middle/Tier 2 price
    price3: number; // Back/Tier 3 price
}

export interface CreateBookingDto {
    seat_count?: number;
}

// Auth Types
export enum UserRole {
    ADMIN = 'admin',
    USER = 'user'
}

export interface User {
    id: number;
    email: string;
    password_hash?: string; // Made optional for responses
    role: UserRole;
    created_at: Date;
}

export interface CreateUserDto {
    email: string;
    password: string;
    role?: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    role?: UserRole;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface AuthTokenPayload {
    userId: number;
    role: UserRole;
}

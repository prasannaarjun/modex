export interface Show {
    id: number;
    title: string;
    description?: string;
    start_time: Date;
    created_at: Date;
}

export interface ShowInventory {
    show_id: number;
    total_seats: number;
    reserved_seats: number;
    confirmed_seats: number;
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
    status: BookingStatus;
    expires_at: Date | null;
    created_at: Date;
}

export interface CreateShowDto {
    title: string;
    description?: string;
    start_time: string; // ISO string
    total_seats: number;
}

export interface CreateBookingDto {
    seat_count?: number; // Optional if we support multi-seat
}

import type { paths } from './schema';

export type RegisterRequest = paths['/api/auth/register']['post']['requestBody']['content']['application/json'];
export type RegisterResponse = never; // 201 has no content, or we can check if it returns anything. YAML says description only.

export type LoginRequest = paths['/api/auth/login']['post']['requestBody']['content']['application/json'];
export type LoginResponse = paths['/api/auth/login']['post']['responses']['200']['content']['application/json'];

export type OnboardRequest = paths['/api/admin/onboard']['post']['requestBody']['content']['application/json'];
export type OnboardResponse = never;

export type CreateShowRequest = paths['/api/shows']['post']['requestBody']['content']['application/json'];
export type CreateShowResponse = never;

// Shows list might not have a schema defined for the array items if it's inline...
// YAML:
// responses:
//   '200':
//     description: A list of shows
// It does NOT define the schema for the list of shows in the responses! see lines 126-127.
// "description: A list of shows" without schema.
// This is a gap in the spec. I will assume it returns an array of shows similar to what create show expects + id or similar.
// I will define a manual Show type for now and update if I see better info or ask the user.
// However, the instructions say "Use that spec as the single source of truth". If spec is missing it, I might need to infer from usage or "mock" it.
// Wait, Create Show defines properties: title, start_time, total_seats.
// I will assume the list returns objects with these + `id`.
// But strictly following the types from schema.d.ts, `paths['/api/shows']['get']['responses']['200']` has `content: never`.
// This implies the spec thinks it returns nothing or unknown.
// I'll define a manual `Show` interface.

// Enum Mirrors
export const SeatType = {
    REGULAR: 'REGULAR',
    PREMIUM: 'PREMIUM',
    VIP: 'VIP'
} as const;
export type SeatType = typeof SeatType[keyof typeof SeatType];

export const SeatStatus = {
    AVAILABLE: 'AVAILABLE',
    BOOKED: 'BOOKED',
    LOCKED: 'LOCKED'
} as const;
export type SeatStatus = typeof SeatStatus[keyof typeof SeatStatus];

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

export interface Show {
    id: number;
    title: string;
    description?: string;
    start_time: string;
    total_seats: number;
    reserved_seats?: number;
    confirmed_seats?: number;
    seats?: Seat[];
}

export type ShowListResponse = Show[]; // Helper

export type ShowDetailsResponse = Show; // Helper

export type BookTicketResponse = {
    booking_id: number; // Spec just says 200 Booking PENDING. Doesn't define content.
    // Requirement says: "Display booking id and expires_at countdown."
    // So the backend MUST return booking_id and expires_at.
    // The spec is missing this in response schema (lines 183-184).
    // I will assume it returns JSON with these fields.
    expires_at: string;
    seats?: number[]; // or count
};
// Spec line 183: '200' description: Booking PENDING.
// No schema.

export type BookingDetailsResponse = {
    id: number;
    status: 'PENDING' | 'CONFIRMED' | 'FAILED';
    seats: number[]; // or count?
    expires_at: string;
};
// Spec line 201: '200' description: Booking details. No schema.

// I will define these manually since spec is incomplete on response shapes.

export interface Theater {
    id: number;
    user_id: number;
    name: string;
    street: string;
    area: string;
    city: string;
    state: string;
    country: string;
    created_at: Date;
}

export interface CreateTheaterDto {
    name: string;
    street: string;
    area: string;
    city: string;
    state: string;
    country: string;
}

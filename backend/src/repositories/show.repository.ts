import { query, getClient } from '../db/pool';
import { Show, ShowInventory, CreateShowDto } from '../types';

export class ShowRepository {
    async findAll(): Promise<(Show & { available_seats: number })[]> {
        const sql = `
      SELECT s.*, 
             (si.total_seats - si.reserved_seats - si.confirmed_seats) as available_seats
      FROM shows s
      JOIN show_inventory si ON s.id = si.show_id
      ORDER BY s.start_time ASC
    `;
        const res = await query(sql, []);
        return res.rows;
    }

    async findById(id: number): Promise<(Show & ShowInventory) | null> {
        const sql = `
      SELECT s.*, si.total_seats, si.reserved_seats, si.confirmed_seats
      FROM shows s
      JOIN show_inventory si ON s.id = si.show_id
      WHERE s.id = $1
    `;
        const res = await query(sql, [id]);
        return res.rows[0] || null;
    }

    async create(data: CreateShowDto): Promise<Show> {
        const client = await getClient();
        try {
            await client.query('BEGIN');

            const insertShowSql = `
        INSERT INTO shows (title, description, start_time)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
            const showRes = await client.query(insertShowSql, [data.title, data.description, data.start_time]);
            const show = showRes.rows[0];

            const insertInventorySql = `
        INSERT INTO show_inventory (show_id, total_seats)
        VALUES ($1, $2)
      `;
            await client.query(insertInventorySql, [show.id, data.total_seats]);

            await client.query('COMMIT');
            return show;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
}

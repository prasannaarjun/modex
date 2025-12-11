# Modex Ticket Booking Backend

A production-quality, concurrency-safe ticket booking API built with Node.js, Express, PostgreSQL, and Redis.

## Features

- **Concurrency Safety**: Uses PostgreSQL `SELECT ... FOR UPDATE` (row-level locking) to prevent overbooking.
- **Expiration**: Unconfirmed bookings expire automatically after 2 minutes via Redis + BullMQ.
- **Architecture**: Layered architecture (Controllers, Services, Repositories).
- **Tech Stack**: TypeScript, Express, pg, Redis.

## Setup

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development outside Docker)

### Running with Docker Compose

1. Clone the repository.
2. Run `docker-compose up --build`.
   - This starts Postgres, Redis, and the Backend.
3. The API will be available at `http://localhost:3000`.
4. Swagger documentation is at `http://localhost:3000/api-docs`.

### Local Development

1. Start DB and Redis:
   \`\`\`bash
   docker-compose up -d postgres redis
   \`\`\`
2. Install dependencies:
   \`\`\`bash
   cd backend
   npm install
   \`\`\`
3. Run migrations:
   \`\`\`bash
   npm run migrate
   \`\`\`
4. Start server:
   \`\`\`bash
   npm run dev
   \`\`\`
5. Start worker (in separate terminal):
   \`\`\`bash
   npx ts-node src/workers/expiry.worker.ts
   \`\`\`

## API Usage

- **Get Shows**: \`GET /api/shows\`
- **Create Show (Admin)**: \`POST /api/shows\`
  Body: \`{ "title": "Concert", "start_time": "2023-12-25T20:00:00Z", "total_seats": 50 }\`
- **Book Ticket**: \`POST /api/shows/:id/book\`
  Returns \`PENDING\` status.
- **Confirm Booking**: \`POST /api/bookings/:id/confirm\`
  Must be called within 2 minutes.

## Concurrency Model

We use **Pessimistic Locking** on the `show_inventory` table.
When a booking request comes in:
1. Start Transaction.
2. `SELECT * FROM show_inventory WHERE show_id = $1 FOR UPDATE`.
3. Check available seats.
4. Increment reserved count.
5. Create Booking record.
6. Commit.

This ensures that concurrent requests are serialized at the database level for the specific show, preventing race conditions.

## Testing

To run the full suite (requires running Postgres/Redis):
\`\`\`bash
npm test
\`\`\`

To run the concurrency stress test:
\`\`\`bash
npm run test:concurrency
\`\`\`

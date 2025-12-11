# Modex Ticket Booking Frontend

Production-ready React + TypeScript frontend for the Modex Ticket Booking app.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_URL` points to your backend (default: `http://localhost:3000`).

3. **Backend Requirement**
   This frontend requires the Modex API Backend running locally on port 3000.
   Also, ensure the backend supports CORS for `http://localhost:5173` (Vite dev port) or configured port.

## Scripts

- `npm run dev` - Start local development server.
- `npm run build` - Build for production.
- `npm run start` - Preview production build.
- `npm test` - Run unit tests (Vitest).
- `npm run e2e` - Run E2E tests (Playwright).
- `npm run lint` - Run ESLint.

## Project Structure

- `src/api` - API client and generated Types (Swagger).
- `src/contexts` - React Contexts (Auth, Shows, Booking).
- `src/components` - Reusable UI components.
- `src/pages` - Route components.
- `src/hooks` - Custom hooks (Socket, Countdown).

## Assumptions & API Handling

- **Booking Request Body**: The provided OpenAPI spec for `POST /api/shows/{id}/book` does not define a request body. However, strictly necessary for the Multi-seat selection requirement, the frontend sends a payload: `{ seat_ids: [...] }` (or `{ count: N }` if seat map unavailable).
- **Seat Map**: The spec does not explicit return a seat map in `GET /api/shows/{id}`. We check for a `seats` array property. If present, we render the Seat Grid. If missing, we fallback to a numeric Ticket Count selector.
- **Admin**: "Onboard Theater" shows a form that calls `POST /api/admin/onboard`.
- **Role Management**: The registration flow includes a checkbox to "Register as Admin" to facilitate testing the Admin Dashboard.

## Docker

Build and run with Docker:
```bash
docker build -t modex-frontend .
docker run -p 80:80 modex-frontend
```

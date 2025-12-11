# Validation Demo Steps

Follow these steps to verify the implementation against the requirements.

## Prerequisites
1. Backend running at `http://localhost:3000`.
2. Frontend running at `http://localhost:5173` (`npm run dev`).

## 1. Authentication
- Go to `/register`.
- Create a new user (e.g., `user@test.com`).
- Verify successful registration toast.
- Redirects to Login. Login with credentials.
- Verify "Hi, user@test.com" in header.

## 2. Admin & Show Creation
- Logout and go to `/register`.
- Register as Admin (check "Register as Admin").
- Login as Admin.
- Verify "Admin" link appears in header.
- Go to `/admin`.
- Tab: **Theater Setup**. Fill details and Save.
- Tab: **Manage Shows**. Create a show "Avengers", Start Time: Tomorrow, Seats: 50.
- Verify "Show created" toast.

## 3. Booking Flow (User)
- Login as the first User (`user@test.com`).
- Home page (`/`) should list "Avengers".
- Click "Book Now".
- **Scenario A (Numeric)**: If backend returns no seats, select tickets with +/- and Click "Book".
- **Scenario B (Grid)**: If backend returns seats, select seats on grid and Click "Book".
- You will be redirected to Confirmation screen with a **Countdown Timer**.
- Status is mocked as PENDING.

## 4. Confirmation
- Wait for a few seconds (observe timer).
- Click "Confirm Booking".
- Verify success message and redirection to `/bookings/:id`.
- Verify Booking Status is CONFIRMED.

## 5. Real-time (Socket.IO)
- Open the app in two different browser windows (Incognito).
- Go to the same Booking page.
- In Window 1, select seats (if Grid).
- Verify Window 2 updates seat status (if backend implements seat events properly).
- Note: This depends on backend emitting `seat_reserved` events.

## 6. Automated Verification
Run the smoke test script:
```bash
./smoke_test.sh
```
This runs the Playwright E2E flow covering Register -> Create Show -> Book -> Confirm.

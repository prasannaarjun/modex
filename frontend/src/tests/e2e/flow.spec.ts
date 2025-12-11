import { test, expect } from '@playwright/test';

const randomString = () => Math.random().toString(36).substring(7);
const userEmail = `user_${randomString()}@example.com`;
const password = 'password123';
const showTitle = `Test Show ${randomString()}`;

test.describe('Modex Ticket Booking Flow', () => {

    test('full flow: register, admin create show, user book', async ({ page }) => {
        // 1. Register User
        await page.goto('/register');
        await page.fill('input[type="email"]', userEmail);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Registration successful')).toBeVisible();

        // 2. Login as User to verify standard role (optional, but good)
        await page.goto('/login');
        await page.fill('input[type="email"]', userEmail);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Hi, ' + userEmail)).toBeVisible();
        await page.click('text=Logout');

        // 3. Register Admin
        const adminEmail = `admin_${randomString()}@example.com`;
        await page.goto('/register');
        await page.fill('input[type="email"]', adminEmail);
        await page.fill('input[type="password"]', password);
        // Check admin checkbox
        await page.check('input[type="checkbox"]');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Registration successful')).toBeVisible();

        // 4. Login Admin
        await page.goto('/login');
        await page.fill('input[type="email"]', adminEmail);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Admin')).toBeVisible();

        // 5. Create Show
        await page.click('text=Admin');
        await page.fill('input[value="100"]', '50'); // Total seats
        await page.fill('input[type="text"]', showTitle);

        // Set date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().slice(0, 16);
        // input type=datetime-local expects YYYY-MM-DDTHH:mm
        await page.fill('input[type="datetime-local"]', dateStr);

        await page.click('button:has-text("Create Show")');
        await expect(page.locator('text=Show created successfully')).toBeVisible();

        // Logout Admin
        await page.click('text=Logout');

        // 6. Login User to Book
        await page.goto('/login');
        await page.fill('input[type="email"]', userEmail);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');

        // 7. Find Show and Book
        await page.goto('/');
        await page.click(`text=${showTitle}`);

        // Assuming we are on Booking Page
        // If backend returns no seats, we see numeric selector.
        // We check for either "Select Seats" (grid) or "Select Number of Tickets"
        // We try to book 1 ticket.

        const hasGrid = await page.isVisible('text=Select Seats');
        if (hasGrid) {
            // Click first available seat. Seat IDs are numbers.
            // We find a seat that is available (bg-white or similar).
            // Since we don't know IDs, we click the first element with the seat class and not reserved.
            // We can just click text="1" or similar if IDs start at 1.
            await page.click('div.cursor-pointer >> nth=0'); // Click first seat
            await page.click('button:has-text("Book Selected Seats")');
        } else {
            // Numeric
            await page.click('button:has-text("Book Tickets")');
        }

        // 8. Confirm Booking
        await expect(page.locator('text=Complete Your Booking')).toBeVisible(); // Countdown page
        await page.click('button:has-text("Confirm Booking")');

        // 9. Verify Success
        await expect(page.locator('text=Booking Confirmed')).toBeVisible();
        await expect(page.locator(`text=${userEmail}`)).toBeVisible(); // Header still there
    });
});

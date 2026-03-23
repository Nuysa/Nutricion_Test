import { test, expect } from '@playwright/test';

test.describe('NutriGo E2E Verification', () => {
    test('should load the login page and navigate to register', async ({ page }) => {
        // Start at login
        await page.goto('/login');
        await page.screenshot({ path: 'test-results/login_page.png' });

        // Verify title/content
        await expect(page).toHaveTitle(/NutriGo/);
        await expect(page.getByText(/Ingresar/i).first()).toBeVisible();

        // Navigate to register using a regex to be more flexible
        await page.click('text=Crea tu perfil');

        // Wait for navigation and verify heading
        await page.waitForURL('**/register');
        await expect(page.getByText(/Nueva Cuenta/i).first()).toBeVisible();
        await page.screenshot({ path: 'test-results/register_page.png' });
    });

    test('should display role selection in registration', async ({ page }) => {
        await page.goto('/register');

        // Verify role selection buttons exist
        await expect(page.getByText('Paciente')).toBeVisible();
        await expect(page.getByText('Especialista')).toBeVisible();
    });

    test('should fill registration form fields', async ({ page }) => {
        await page.goto('/register');

        // Fill fields using IDs
        await page.fill('#fullName', 'Test User');
        await page.fill('#email', 'test@example.com');
        await page.fill('#password', 'Password123!');
        await page.fill('#confirmPassword', 'Password123!');

        // Verify values
        await expect(page.locator('#fullName')).toHaveValue('Test User');
    });
});

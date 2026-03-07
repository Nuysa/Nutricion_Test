import { test, expect } from '@playwright/test';

test.describe('NutriGo E2E Verification', () => {
    test('should load the login page and navigate to register', async ({ page }) => {
        // Start at login
        await page.goto('/login');
        await page.screenshot({ path: 'test-results/login_page.png' });

        // Verify title/content
        await expect(page).toHaveTitle(/NutriGo/);
        await expect(page.getByText('Bienvenido de vuelta')).toBeVisible();

        // Navigate to register using a regex to be more flexible
        await page.getByRole('link', { name: /Regístrate gratis/i }).click();

        // Wait for navigation and verify heading (case-insensitive)
        await page.waitForURL('**/register');
        await expect(page.getByRole('heading', { name: /Crear cuenta/i })).toBeVisible();
        await page.screenshot({ path: 'test-results/register_page.png' });
    });

    test('should display role selection in registration', async ({ page }) => {
        await page.goto('/register');

        // Verify custom role selection buttons exist
        await expect(page.getByRole('button', { name: 'Paciente', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Nutricionista', exact: true })).toBeVisible();
    });

    test('should fill registration form fields', async ({ page }) => {
        await page.goto('/register');

        // Fill fields
        await page.fill('input[placeholder="Juan Pérez"]', 'Test User');
        await page.fill('input[placeholder="tu@email.com"]', 'test@example.com');
        await page.fill('input[placeholder="Mínimo 6 caracteres"]', 'Password123!');
        await page.fill('input[placeholder="Repite tu contraseña"]', 'Password123!');

        // Verify values
        await expect(page.locator('input[placeholder="Juan Pérez"]')).toHaveValue('Test User');
    });
});

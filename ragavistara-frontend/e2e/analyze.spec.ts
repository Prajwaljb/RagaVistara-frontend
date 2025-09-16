import { test, expect } from '@playwright/test'
import path from 'node:path'

test('Analyze happy path (mocked)', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Analyze' }).click()

  // Upload a tiny dummy file
  const filePath = path.join(__dirname, 'fixtures', 'silence.wav')
  await page.setInputFiles('input[type="file"]', filePath)

  await page.getByRole('button', { name: 'Run Analysis' }).click()
  await expect(page.getByText('Status:')).toBeVisible()
  await expect(page.getByText('Top Raga')).toBeVisible({ timeout: 8000 })
  await expect(page.getByText('Pitch Contour')).toBeVisible()
})



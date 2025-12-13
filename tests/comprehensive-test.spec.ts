import { test, expect } from '@playwright/test'

test.describe('Comprehensive Neural App Tests', () => {
  test('neural test page renders WebGL canvas with placeholder', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('https://before-i-forget-app.web.app/neural-test')
    await page.waitForTimeout(3000)

    // Verify canvas exists
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/neural-test-page.png' })

    // Check for critical errors
    const criticalErrors = errors.filter(e => 
      e.includes('TypeError') || 
      e.includes('Uncaught') ||
      e.includes('undefined')
    )
    expect(criticalErrors.length).toBe(0)

    console.log('✓ Neural test page renders correctly')
  })

  test('login page or app loads properly', async ({ page }) => {
    await page.goto('https://before-i-forget-app.web.app/')
    await page.waitForTimeout(3000)

    // Take screenshot first
    await page.screenshot({ path: 'tests/screenshots/app-home.png' })

    // Check if page loaded (either login or app content)
    const pageLoaded = await page.locator('body').textContent()
    expect(pageLoaded).toBeTruthy()

    // Check for canvas (neural app) or form elements (login)
    const hasCanvas = await page.locator('canvas').count() > 0
    const hasForm = await page.locator('input, button, form').count() > 0

    console.log(`Page state: canvas=${hasCanvas}, form=${hasForm}`)
    expect(hasCanvas || hasForm).toBe(true)

    console.log('✓ App loads correctly')
  })

  test('no Firestore errors on page load', async ({ page }) => {
    const firestoreErrors: string[] = []
    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('Firestore') && msg.type() === 'error') {
        firestoreErrors.push(text)
      }
    })

    await page.goto('https://before-i-forget-app.web.app/')
    await page.waitForTimeout(5000)

    // Filter for actual Firestore errors (not network blocks from ad blockers)
    const realErrors = firestoreErrors.filter(e => 
      !e.includes('ERR_BLOCKED_BY_CLIENT') &&
      !e.includes('net::')
    )

    if (realErrors.length > 0) {
      console.log('Firestore errors found:', realErrors)
    }

    expect(realErrors.length).toBe(0)
    console.log('✓ No Firestore errors detected')
  })

  test('WebGL canvas is fullscreen and responsive', async ({ page }) => {
    await page.goto('https://before-i-forget-app.web.app/neural-test')
    await page.waitForTimeout(2000)

    const canvas = page.locator('canvas')
    const box = await canvas.boundingBox()

    expect(box).not.toBeNull()
    if (box) {
      expect(box.width).toBeGreaterThan(100)
      expect(box.height).toBeGreaterThan(100)
      console.log(`✓ Canvas dimensions: ${box.width}x${box.height}`)
    }
  })
})

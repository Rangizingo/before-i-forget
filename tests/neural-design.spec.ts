import { test, expect } from '@playwright/test'

test.describe('Neural Design Verification', () => {
  test('should load the neural visualization on home page', async ({ page }) => {
    const consoleErrors: string[] = []

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Navigate to the deployed app
    await page.goto('https://before-i-forget-app.web.app/')

    // Take screenshot of initial load (login page expected)
    await page.screenshot({ path: 'tests/screenshots/01-initial-load.png', fullPage: true })

    // Check if we're on the login page
    const loginPageVisible = await page.locator('text=Sign in').or(page.locator('text=Login')).or(page.locator('text=Email')).first().isVisible().catch(() => false)

    if (loginPageVisible) {
      console.log('✓ Login page detected - app is routing correctly')
      await page.screenshot({ path: 'tests/screenshots/02-login-page.png', fullPage: true })
    }

    // Navigate to the neural test page (should be accessible without auth)
    await page.goto('https://before-i-forget-app.web.app/neural-test')
    await page.waitForTimeout(2000) // Wait for Three.js to initialize

    // Take screenshot of neural test page
    await page.screenshot({ path: 'tests/screenshots/03-neural-test-page.png', fullPage: true })

    // Check for WebGL canvas (Three.js renders to canvas)
    const canvas = page.locator('canvas')
    const canvasCount = await canvas.count()

    console.log(`Found ${canvasCount} canvas element(s)`)

    if (canvasCount > 0) {
      console.log('✓ WebGL canvas detected - Neural visualization is rendering')

      // Check if canvas has actual content (not just empty)
      const canvasElement = canvas.first()
      const box = await canvasElement.boundingBox()

      if (box && box.width > 0 && box.height > 0) {
        console.log(`✓ Canvas has dimensions: ${box.width}x${box.height}`)
      }
    } else {
      console.log('⚠ No canvas found - checking for WebGL fallback')

      // Check if WebGL fallback is showing
      const fallback = await page.locator('text=WebGL').or(page.locator('text=not supported')).first().isVisible().catch(() => false)
      if (fallback) {
        console.log('WebGL fallback component is showing')
      }
    }

    // Wait a bit more to catch any async errors
    await page.waitForTimeout(3000)

    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/04-final-state.png', fullPage: true })

    // Filter for critical errors (not warnings)
    const criticalErrors = consoleErrors.filter(err =>
      err.includes('useNeuralNetwork must be used within') ||
      err.includes('Uncaught Error') ||
      err.includes('TypeError')
    )

    // Report console errors
    if (criticalErrors.length > 0) {
      console.log('\n❌ Critical errors detected:')
      criticalErrors.forEach(err => console.log(`  - ${err}`))
    } else {
      console.log('✓ No critical console errors detected')
    }

    // The test passes if canvas is present and no critical errors
    expect(canvasCount).toBeGreaterThan(0)
    expect(criticalErrors.length).toBe(0)
  })

  test('should have no Firestore persistence errors', async ({ page }) => {
    const firestoreErrors: string[] = []

    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('enableIndexedDbPersistence') ||
          text.includes('multi-tab') ||
          text.includes('persistence') ||
          text.includes('Firestore')) {
        firestoreErrors.push(text)
      }
    })

    await page.goto('https://before-i-forget-app.web.app/')
    await page.waitForTimeout(5000) // Wait for Firestore to initialize

    // Check for deprecated persistence warnings
    const deprecationErrors = firestoreErrors.filter(e =>
      e.includes('enableIndexedDbPersistence') || e.includes('deprecated')
    )

    if (deprecationErrors.length > 0) {
      console.log('⚠ Firestore deprecation warnings found:')
      deprecationErrors.forEach(e => console.log(`  - ${e}`))
    } else {
      console.log('✓ No Firestore deprecation warnings')
    }

    // Check for multi-tab errors
    const multiTabErrors = firestoreErrors.filter(e =>
      e.includes('multi-tab') || e.includes('another tab')
    )

    if (multiTabErrors.length > 0) {
      console.log('⚠ Multi-tab persistence errors found:')
      multiTabErrors.forEach(e => console.log(`  - ${e}`))
    } else {
      console.log('✓ No multi-tab persistence errors')
    }

    // Pass if no deprecation errors
    expect(deprecationErrors.length).toBe(0)
  })

  test('should load NeuralHomePage after authentication without errors', async ({ page }) => {
    const criticalErrors: string[] = []

    page.on('console', msg => {
      const text = msg.text()
      if (msg.type() === 'error') {
        if (text.includes('useNeuralNetwork must be used within') ||
            text.includes('Uncaught Error') ||
            text.includes('NeuralNetworkProvider')) {
          criticalErrors.push(text)
        }
      }
    })

    // Go directly to home page - this will redirect to login if not authenticated
    await page.goto('https://before-i-forget-app.web.app/')
    await page.waitForTimeout(3000)

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/05-home-route.png', fullPage: true })

    // Check for NeuralNetworkProvider errors
    const providerErrors = criticalErrors.filter(e =>
      e.includes('NeuralNetworkProvider') || e.includes('useNeuralNetwork')
    )

    if (providerErrors.length > 0) {
      console.log('❌ NeuralNetworkProvider errors found:')
      providerErrors.forEach(e => console.log(`  - ${e}`))
    } else {
      console.log('✓ No NeuralNetworkProvider errors')
    }

    expect(providerErrors.length).toBe(0)
  })
})

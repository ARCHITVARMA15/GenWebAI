import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { existsSync } from 'fs'

const SSRF_BLOCK = /^https?:\/\/(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i

// Mac / Linux local Chrome paths to try in order
const LOCAL_CHROME_PATHS = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
]

const getExecutablePath = async () => {
    // Allow explicit override via env var (useful for CI or custom installs)
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        return process.env.PUPPETEER_EXECUTABLE_PATH
    }

    // Production / serverless (Lambda, Render, etc.) — use @sparticuz/chromium
    if (process.env.NODE_ENV === 'production' || process.env.AWS_LAMBDA_FUNCTION_NAME) {
        return await chromium.executablePath()
    }

    // Local development — find the first existing Chrome/Chromium binary
    for (const p of LOCAL_CHROME_PATHS) {
        if (existsSync(p)) return p
    }

    // Last resort: fall back to @sparticuz/chromium even locally
    return await chromium.executablePath()
}

export const captureScreenshot = async (url) => {
    if (!url.startsWith('https://')) {
        if (url.startsWith('http://')) {
            url = 'https://' + url.slice(7)
        } else {
            throw new Error('URL must start with https://')
        }
    }

    if (SSRF_BLOCK.test(url)) {
        throw new Error('Could not capture screenshot of that URL')
    }

    let browser = null
    const TOTAL_TIMEOUT = 30000

    const timer = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Could not capture screenshot of that URL')), TOTAL_TIMEOUT)
    )

    const capture = async () => {
        const executablePath = await getExecutablePath()

        browser = await puppeteer.launch({
            executablePath,
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-background-networking',
            ],
            defaultViewport: { width: 1280, height: 800 },
        })

        const page = await browser.newPage()
        page.setDefaultNavigationTimeout(20000)
        await page.setViewport({ width: 1280, height: 800 })

        await page.goto(url, { waitUntil: 'networkidle2' })

        const buffer = await page.screenshot({ type: 'png', fullPage: false, encoding: 'base64' })
        return buffer
    }

    try {
        return await Promise.race([capture(), timer])
    } catch (err) {
        throw new Error('Could not capture screenshot of that URL')
    } finally {
        if (browser) await browser.close().catch(() => {})
    }
}

import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

const SSRF_BLOCK = /^https?:\/\/(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i

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
    const TOTAL_TIMEOUT = 20000

    const timer = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Could not capture screenshot of that URL')), TOTAL_TIMEOUT)
    )

    const capture = async () => {
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: { width: 1280, height: 800 },
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        })

        const page = await browser.newPage()
        page.setDefaultNavigationTimeout(15000)
        await page.setViewport({ width: 1280, height: 800 })

        await page.goto(url, { waitUntil: 'networkidle2' })

        const buffer = await page.screenshot({ type: 'png', fullPage: true, encoding: 'base64' })
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

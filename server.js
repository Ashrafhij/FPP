const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

let browserInstance = null;

async function getBrowser() {
    if (!browserInstance || !browserInstance.connected) {
        browserInstance = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process'
            ]
        });
    }
    return browserInstance;
}

async function scrapeGoogleFlights(origin, destination, date) {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 800 });

        const url = `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}+on+${date}`;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

        await new Promise(r => setTimeout(r, 3000));

        const flights = await page.evaluate(() => {
            const results = [];

            const priceElements = document.querySelectorAll('[data-value]');
            priceElements.forEach(el => {
                const price = parseInt(el.getAttribute('data-value'));
                if (price && price > 0) {
                    results.push({ price });
                }
            });

            if (results.length === 0) {
                const allText = document.body.innerText;
                const priceMatches = allText.match(/\$\d{1,5}/g) || [];
                priceMatches.forEach(match => {
                    const price = parseInt(match.replace('$', ''));
                    if (price > 0 && price < 10000) {
                        results.push({ price });
                    }
                });
            }

            return results;
        });

        return flights;
    } catch (err) {
        console.error('Scrape error:', err.message);
        return [];
    } finally {
        await page.close();
    }
}

app.post('/api/search', async (req, res) => {
    const { origin, destination, date } = req.body;

    if (!origin || !destination || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const flights = await scrapeGoogleFlights(origin, destination, date);

        if (flights.length === 0) {
            return res.json({ prices: [], message: 'No flights found or page structure changed' });
        }

        const prices = flights.map(f => f.price).sort((a, b) => a - b);
        const cheapest = prices[0];
        const average = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

        res.json({
            prices: prices.slice(0, 10),
            cheapest,
            average,
            total: prices.length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

process.on('SIGTERM', async () => {
    if (browserInstance) await browserInstance.close();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`Flight tracker server running on port ${PORT}`);
});

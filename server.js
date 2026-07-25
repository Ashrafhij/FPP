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
        await page.setViewport({ width: 1280, height: 900 });

        const url = `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}+on+${date}`;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

        await new Promise(r => setTimeout(r, 4000));

        const flights = await page.evaluate(() => {
            const results = [];

            const lists = document.querySelectorAll('li');
            lists.forEach(li => {
                const text = li.innerText;
                const priceMatch = text.match(/\$(\d[\d,]*)/);
                if (!priceMatch) return;

                const price = parseInt(priceMatch[1].replace(/,/g, ''));
                if (!price || price < 10 || price > 50000) return;

                const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                let airline = '';
                let times = '';
                let duration = '';
                let stops = '';

                for (const line of lines) {
                    if (/^\d{1,2}:\d{2}\s*(AM|PM)?\s*[–-]\s*\d{1,2}:\d{2}/.test(line)) {
                        times = line;
                    } else if (/^\d+\s*h\s*\d*\s*m?$/.test(line) || /^\d+h/.test(line)) {
                        duration = line;
                    } else if (/^Nonstop$|^Direct$|^\d+\s*stop/i.test(line)) {
                        stops = line;
                    } else if (line.length > 3 && line.length < 40 && !/^\$/.test(line) && !/^\d/.test(line) && !/stop/i.test(line) && !/h$/.test(line)) {
                        if (!airline) airline = line;
                    }
                }

                if (times || airline) {
                    results.push({ price, airline, times, duration, stops });
                }
            });

            if (results.length === 0) {
                const priceElements = document.querySelectorAll('[data-value]');
                priceElements.forEach(el => {
                    const price = parseInt(el.getAttribute('data-value'));
                    if (price && price > 0 && price < 50000) {
                        results.push({ price, airline: '', times: '', duration: '', stops: '' });
                    }
                });
            }

            if (results.length === 0) {
                const allText = document.body.innerText;
                const priceMatches = allText.match(/\$\d{1,5}/g) || [];
                priceMatches.forEach(match => {
                    const price = parseInt(match.replace('$', '').replace(/,/g, ''));
                    if (price > 0 && price < 10000) {
                        results.push({ price, airline: '', times: '', duration: '', stops: '' });
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
            return res.json({ flights: [], cheapest: null, average: null, total: 0 });
        }

        const sorted = [...flights].sort((a, b) => a.price - b.price);
        const cheapest = sorted[0].price;
        const average = Math.round(sorted.reduce((sum, f) => sum + f.price, 0) / sorted.length);

        res.json({
            flights: sorted.slice(0, 20),
            cheapest,
            average,
            total: sorted.length
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

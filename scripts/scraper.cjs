const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../database.json');
const LOG_PATH = path.join(__dirname, '../automation_logs.txt');

puppeteer.use(StealthPlugin());

const PLANS = [
    { name: 'STANDARD', url: 'https://wintipster.com/standard-plan-archives/' },
    { name: 'PREMIUM', url: 'https://wintipster.com/premium-plan-archives/' },
    { name: 'ELITE', url: 'https://wintipster.com/elite-plan-archives/' }
];

// --- SENIOR LOGGING SYSTEM ---
function log(msg, type = 'INFO') {
    const timestamp = new Date().toLocaleString();
    let prefix = `[${type}]`;
    if (type === 'SUCCESS') prefix = '✅ [SUCCESS]';
    if (type === 'UPDATE') prefix = '🔄 [UPDATE]';
    if (type === 'ERROR') prefix = '❌ [ERROR]';
    if (type === 'WARN') prefix = '⚠️ [WARN]';

    const fullMsg = `[${timestamp}] ${prefix} ${msg}`;
    console.log(fullMsg);
    fs.appendFileSync(LOG_PATH, fullMsg + '\n');
}

function cleanText(t) {
    return (t || "").replace(/\s+/g, ' ').trim();
}

// --- EVASION & JITTER ---
const sleep = (ms) => new Promise(r => setTimeout(r, ms + Math.random() * 1000));

async function scrapePlan(browser, plan, duration) {
    log(`Iniciando extracción en ${plan.name} (Modo: ${duration})`, 'INFO');
    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    try {
        await page.goto(plan.url, { waitUntil: 'networkidle2', timeout: 90000 });
        await sleep(3000); // Senior delay for rendering

        const extracted = await page.evaluate(() => {
            const items = [];
            const containers = document.querySelectorAll('[class*="tipsContainer"]');

            containers.forEach((container, index) => {
                const dateRaw = container.querySelector('.dateDisplay')?.innerText.trim() || '';
                const type = container.querySelector('.singleDoubleDisplay')?.innerText.trim() || 'SINGLE';

                const matchNodes = container.querySelectorAll('.prediction');
                const betNodes = container.querySelectorAll('.predictionType');

                const matches = [];
                matchNodes.forEach((node, i) => {
                    const eventText = node.innerText.trim();
                    const betText = betNodes[i]?.innerText.trim().replace(/^Bet:\s*/i, '') || '';
                    if (eventText) {
                        matches.push({
                            event: eventText,
                            bet: betText
                        });
                    }
                });

                const odds = container.querySelector('.oddsDisplay')?.innerText.trim() || '';
                const unit = container.querySelector('.unitDisplay')?.innerText.trim() || '';
                const rate = container.querySelector('.chanceDisplay')?.innerText.trim() || '';

                const resEl = container.querySelector('.winner, .losser, .draw, .mixedw, .void, .tipResult div:last-child');
                const result = resEl ? resEl.innerText.trim() : 'PENDING';

                items.push({
                    date: dateRaw,
                    type,
                    matches,
                    odds,
                    unit,
                    rate,
                    result,
                    originalIndex: index
                });
            });
            return items;
        });

        // --- VALIDATION ENGINE (Senior Update) ---
        const today = new Date();
        const formatDate = (d) => d.toISOString().split('T')[0];

        // Window defining: How far back should we check for new/pending picks?
        // Default 'YESTERDAY' now scans 7 days back to catch result settlements.
        const last7Days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(formatDate(d));
        }

        const monthStartStr = formatDate(today).substring(0, 8) + '01';

        const validPicks = [];
        extracted.forEach(p => {
            // Check for missing critical data
            if (!p.date || p.matches.length === 0 || !p.odds) {
                log(`Pick incompleto en ${plan.name} pos ${p.originalIndex}. Saltando...`, 'WARN');
                return;
            }

            const parts = p.date.split('.');
            if (parts.length !== 3) return;

            const yearStr = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            const fDate = `${yearStr}-${parts[1]}-${parts[0]}`;

            // Apply Contextual Filters
            let passes = true;
            if (duration === 'YESTERDAY') {
                passes = last7Days.includes(fDate);
            } else if (duration === 'WEEK') {
                const curr = new Date();
                const diff = curr.getDate() - (curr.getDay() || 7) + 1;
                const weekStart = formatDate(new Date(curr.setDate(diff)));
                passes = fDate >= weekStart;
            } else if (duration === 'MONTH') {
                passes = fDate >= monthStartStr;
            }

            if (passes) {
                validPicks.push({ ...p, fDate, source: plan.name });
            }
        });

        log(`Capturados ${validPicks.length}/${extracted.length} picks válidos para ${plan.name}.`, 'SUCCESS');
        return validPicks;
    } catch (error) {
        log(`Falla en ${plan.name}: ${error.message}`, 'ERROR');
        return [];
    } finally {
        await page.close();
    }
}

async function run() {
    const args = process.argv.slice(2);
    const targetPlan = args.find(a => a.startsWith('--plan='))?.split('=')[1] || 'ALL';
    const duration = args.find(a => a.startsWith('--duration='))?.split('=')[1] || 'ALL';

    fs.writeFileSync(LOG_PATH, `--- CONTROLADOR PRO V2.0: ${new Date().toLocaleString()} ---\n`);
    log(`Sincronización Iniciada: Plan=${targetPlan} | Modo=${duration}`, 'INFO');

    const plansToProcess = targetPlan === 'ALL' ? PLANS : PLANS.filter(p => p.name === targetPlan);

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        let allExtracted = [];
        for (const plan of plansToProcess) {
            const picks = await scrapePlan(browser, plan, duration);
            allExtracted = allExtracted.concat(picks);
            await sleep(1500); // Jitter between plans
        }

        const dbRaw = fs.readFileSync(DB_PATH, 'utf8');
        let db = { picks: [], config: {} };
        try { db = JSON.parse(dbRaw || '{"picks":[],"config":{}}'); } catch (e) { }
        if (!db.picks) db.picks = [];

        let stats = { added: 0, updated: 0, skipped: 0 };

        allExtracted.forEach(np => {
            const firstMatchEv = np.matches[0]?.event || 'N/A';
            const cleanEv = cleanText(firstMatchEv);
            const index = db.picks.findIndex(p =>
                p.date === np.fDate &&
                p.matches.length === np.matches.length &&
                cleanText(p.matches[0]?.event).toLowerCase() === cleanEv.toLowerCase() &&
                p.source === np.source
            );

            if (index === -1) {
                // INSERT NEW
                db.picks.push({
                    id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36).slice(-3),
                    date: np.fDate,
                    type: np.type,
                    matches: np.matches,
                    odds: parseFloat(np.odds) || 0,
                    result: np.result.toUpperCase(),
                    source: np.source,
                    ts: Date.now(),
                    metadata: { unit: np.unit, rate: np.rate }
                });
                stats.added++;
            } else {
                // SYNC RESULTS (UPSERT)
                const existing = db.picks[index];
                const newRes = np.result.toUpperCase();

                if (existing.result === 'PENDING' && newRes !== 'PENDING') {
                    existing.result = newRes;
                    log(`Actualizado resultado: ${cleanEv} -> ${newRes}`, 'UPDATE');
                    stats.updated++;
                } else {
                    stats.skipped++;
                }
            }
        });

        // Final Report
        log(`PROCESO COMPLETADO:`, 'INFO');
        log(`- Picks nuevos: ${stats.added}`, 'SUCCESS');
        log(`- Resultados liquidados: ${stats.updated}`, 'UPDATE');
        log(`-picks ya procesados: ${stats.skipped}`, 'INFO');

        if (stats.added > 0 || stats.updated > 0) {
            db.picks.sort((a, b) => a.date.localeCompare(b.date) || a.ts - b.ts);
            fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
            log("Base de datos persistida con éxito.", 'SUCCESS');
        }

    } catch (error) {
        log(`ERROR CRITICO MOTOR: ${error.message}`, 'ERROR');
    } finally {
        await browser.close();
        log("--- SESION FINALIZADA. ---", 'INFO');
    }
}

run();

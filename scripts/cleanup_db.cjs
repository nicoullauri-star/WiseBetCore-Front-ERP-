const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../database.json');

if (!fs.existsSync(dbPath)) {
    console.log("Database not found at: " + dbPath);
    process.exit(0);
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const unique = new Map();
const originalCount = (db.picks || []).length;

if (originalCount === 0) {
    console.log("Database is empty.");
    process.exit(0);
}

db.picks.forEach(p => {
    const mKey = p.matches.map(m =>
        `${(m.event || "").trim().toLowerCase()}-${(m.bet || "").trim().toLowerCase()}`
    ).sort().join('|');

    const key = `${p.date}-${(p.source || "ALL").toUpperCase()}-${mKey}-${parseFloat(p.odds || 0).toFixed(2)}`;

    if (!unique.has(key)) {
        unique.set(key, p);
    } else {
        const existing = unique.get(key);
        if (existing.result === 'PENDING' && p.result !== 'PENDING') {
            unique.set(key, p);
        }
    }
});

db.picks = Array.from(unique.values()).sort((a, b) => a.date.localeCompare(b.date) || (a.ts - b.ts));

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log(`Successfully cleaned ${originalCount - db.picks.length} duplicates from database.json.`);

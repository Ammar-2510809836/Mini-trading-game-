// scripts/generatePrices.js
// Run: node scripts/generatePrices.js
// Generates data/historicalPrices.json with 365 realistic price entries

const fs = require("fs");
const path = require("path");

const TICKS = 365;

// Seed values — realistic approximate prices around Jan 2025
const SEEDS = {
  BTC: 95000,
  Gold: 2650,
  Oil: 74,
};

// Volatility (daily % std-dev)
const VOL = {
  BTC: 0.04,   // 4% daily vol — crypto is wild
  Gold: 0.008, // 0.8% — gold is stable
  Oil: 0.02,   // 2% — oil is moderately volatile
};

// Slight upward drift per day
const DRIFT = {
  BTC: 0.0003,
  Gold: 0.0001,
  Oil: -0.0001,
};

function gaussRandom() {
  // Box-Muller transform to simulate normal distribution
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function simulateGBM(seed, drift, vol, ticks) {
  const prices = [seed];
  for (let i = 1; i < ticks; i++) {
    const prev = prices[i - 1];
    const dailyReturn = drift + vol * gaussRandom();
    prices.push(Math.max(prev * (1 + dailyReturn), 0.01));
  }
  return prices;
}

const btcPrices  = simulateGBM(SEEDS.BTC,  DRIFT.BTC,  VOL.BTC,  TICKS);
const goldPrices = simulateGBM(SEEDS.Gold, DRIFT.Gold, VOL.Gold, TICKS);
const oilPrices  = simulateGBM(SEEDS.Oil,  DRIFT.Oil,  VOL.Oil,  TICKS);

const data = Array.from({ length: TICKS }, (_, i) => ({
  tick:       i,
  date:       new Date(Date.UTC(2025, 0, 1) + i * 86400000).toISOString().slice(0, 10),
  BTC_price:  Math.round(btcPrices[i] * 100) / 100,
  Gold_price: Math.round(goldPrices[i] * 100) / 100,
  Oil_price:  Math.round(oilPrices[i] * 100) / 100,
}));

const outDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(
  path.join(outDir, "historicalPrices.json"),
  JSON.stringify(data, null, 2)
);

console.log(`✅ Generated ${TICKS} price entries → data/historicalPrices.json`);
console.log(`   BTC  start: $${data[0].BTC_price.toLocaleString()}  end: $${data[364].BTC_price.toLocaleString()}`);
console.log(`   Gold start: $${data[0].Gold_price.toLocaleString()}  end: $${data[364].Gold_price.toLocaleString()}`);
console.log(`   Oil  start: $${data[0].Oil_price.toLocaleString()}  end: $${data[364].Oil_price.toLocaleString()}`);

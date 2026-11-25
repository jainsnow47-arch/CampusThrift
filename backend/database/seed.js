const { initDatabase } = require('../config/db');

// Deterministic pseudo-random generator so the 200-row dataset is reproducible across runs
function createRng(seedValue = 20260401) {
  let state = seedValue >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const CATEGORY_CATALOG = [
  {
    category: 'Books',
    count: 32,
    baseRetention: 0.56,
    monthlyDecay: 0.0085,
    items: [
      { name: 'Engineering Mathematics (BS Grewal)', price: 780 },
      { name: 'Introduction to Algorithms (CLRS)', price: 1450 },
      { name: 'Operating System Concepts (Silberschatz)', price: 960 },
      { name: 'Digital Logic Design (Morris Mano)', price: 720 },
      { name: 'Signals and Systems (Oppenheim)', price: 890 },
      { name: 'Strength of Materials (Timoshenko)', price: 820 },
      { name: 'GATE CS Solved Papers Set', price: 650 },
      { name: 'Organic Chemistry (Morrison & Boyd)', price: 940 }
    ]
  },
  {
    category: 'Calculators',
    count: 30,
    baseRetention: 0.79,
    monthlyDecay: 0.0055,
    items: [
      { name: 'Casio fx-991EX ClassWiz Scientific Calculator', price: 1350 },
      { name: 'Casio fx-991ES Plus Scientific Calculator', price: 1200 },
      { name: 'Casio fx-82MS Scientific Calculator', price: 650 },
      { name: 'Texas Instruments TI-30XS MultiView', price: 1800 },
      { name: 'Canon F-789SGA Scientific Calculator', price: 1100 }
    ]
  },
  {
    category: 'Cycles',
    count: 30,
    baseRetention: 0.68,
    monthlyDecay: 0.008,
    items: [
      { name: 'Hero Sprint 26T Single Speed Cycle', price: 7500 },
      { name: 'Hercules Roadeo 21-Gear MTB', price: 11500 },
      { name: 'Firefox Bad Attitude 8 Hybrid', price: 14500 },
      { name: 'Btwin MyBike 26T Campus Commuter', price: 8200 },
      { name: 'Atlas Goldline Campus Cruiser', price: 6400 }
    ]
  },
  {
    category: 'Electronics',
    count: 32,
    baseRetention: 0.64,
    monthlyDecay: 0.011,
    items: [
      { name: 'Logitech M331 Silent Wireless Mouse', price: 1495 },
      { name: 'Arduino Uno R3 Starter Electronics Kit', price: 2200 },
      { name: 'Raspberry Pi 4 Model B (4GB) + Case', price: 5800 },
      { name: 'JBL Tune 510BT Wireless Headphones', price: 3499 },
      { name: 'TP-Link Archer C6 Wi-Fi Router', price: 2499 },
      { name: 'Kindle Paperwhite (10th Gen, 8GB)', price: 12999 },
      { name: 'Portronics Adjustable Aluminium Laptop Stand', price: 1299 }
    ]
  },
  {
    category: 'Furniture',
    count: 26,
    baseRetention: 0.60,
    monthlyDecay: 0.009,
    items: [
      { name: 'Foldable Wooden Hostel Study Table', price: 1800 },
      { name: 'Ergonomic Mesh Desk Chair', price: 4200 },
      { name: '3-Tier Steel Dorm Bookshelf', price: 2100 },
      { name: 'Orthopedic Single Hostel Mattress', price: 3800 },
      { name: 'LED Clamp Study Lamp with Dimmer', price: 950 }
    ]
  },
  {
    category: 'Lab Equipment',
    count: 26,
    baseRetention: 0.74,
    monthlyDecay: 0.0065,
    items: [
      { name: 'Mini Drafter + Drawing Board Set', price: 1450 },
      { name: 'White Cotton Lab Coat (Size M)', price: 650 },
      { name: 'Digital Multimeter Mastech MAS830L', price: 1100 },
      { name: 'Breadboard + Jumper Wire + IC Kit', price: 850 },
      { name: 'Vernier Caliper & Micrometer Gauge Set', price: 1600 }
    ]
  },
  {
    category: 'Other',
    count: 24,
    baseRetention: 0.54,
    monthlyDecay: 0.012,
    items: [
      { name: 'Yonex Astrox Badminton Racket + Cover', price: 2600 },
      { name: 'Prestige Electric Kettle (1.5L)', price: 1250 },
      { name: 'Wildcraft 45L Campus Backpack', price: 2400 },
      { name: 'Acoustic Guitar 38-inch Beginner Kit', price: 4500 },
      { name: 'Dorm Laundry Basket & Clothes Rack', price: 900 }
    ]
  }
];

const CONDITION_MULTIPLIERS = [
  { grade: 'Like New', mult: 1.06, weight: 0.16 },
  { grade: 'Excellent', mult: 0.96, weight: 0.24 },
  { grade: 'Good', mult: 0.86, weight: 0.34 },
  { grade: 'Fair', mult: 0.72, weight: 0.18 },
  { grade: 'Poor', mult: 0.56, weight: 0.08 }
];

function pickCondition(rng, index, category) {
  // Ensure calculators have a well-balanced spread around Good/24 months for comparable queries
  if (category === 'Calculators') {
    const cycle = ['Good', 'Good', 'Excellent', 'Good', 'Fair', 'Like New', 'Good', 'Excellent', 'Fair', 'Poor'];
    return CONDITION_MULTIPLIERS.find((c) => c.grade === cycle[index % cycle.length]);
  }
  const r = rng();
  let acc = 0;
  for (const c of CONDITION_MULTIPLIERS) {
    acc += c.weight;
    if (r <= acc) return c;
  }
  return CONDITION_MULTIPLIERS[2];
}

function buildHistoricalTransactions() {
  const rng = createRng(20260401);
  const rows = [];

  for (const cat of CATEGORY_CATALOG) {
    for (let i = 0; i < cat.count; i++) {
      const template = cat.items[i % cat.items.length];
      const cond = pickCondition(rng, i, cat.category);

      let ageInMonths;
      if (cat.category === 'Calculators' && i < 19) {
        // Keep ~19 calculators within +/- 10 months of 24 months and Good/Excellent/Fair
        ageInMonths = 16 + (i % 15);
      } else {
        ageInMonths = 2 + Math.floor(rng() * 40);
      }

      const noise = 0.95 + rng() * 0.10;
      const ageFactor = Math.max(0.45, 1 - cat.monthlyDecay * ageInMonths);
      let ratio = cat.baseRetention * cond.mult * ageFactor * noise;
      ratio = Math.min(0.92, Math.max(0.20, Number(ratio.toFixed(4))));

      const originalPrice = template.price;
      const soldPrice = Math.max(50, Math.round((originalPrice * ratio) / 10) * 10);
      const exactRatio = Number((soldPrice / originalPrice).toFixed(4));

      rows.push({
        itemName: template.name,
        category: cat.category,
        condition: cond.grade,
        ageInMonths,
        originalPrice,
        soldPrice,
        resaleRatio: exactRatio
      });
    }
  }

  return rows;
}

const DEFAULT_LISTINGS = [
  {
    itemName: 'Casio fx-991EX ClassWiz Scientific Calculator',
    category: 'Calculators',
    condition: 'Excellent',
    ageInMonths: 14,
    originalPrice: 1350,
    suggestedPrice: 890,
    sellingPrice: 850,
    description: 'Used for two engineering semesters. Crisp display, solar + battery working 100%. Includes protective slide cover.',
    sellerName: 'Panda_27 (ECE 3rd Yr)',
    contactInfo: 'panda27@campus.example',
    imageUrl: ''
  },
  {
    itemName: 'CLRS Introduction to Algorithms (3rd Edition)',
    category: 'Books',
    condition: 'Good',
    ageInMonths: 18,
    originalPrice: 1450,
    suggestedPrice: 680,
    sellingPrice: 650,
    description: 'Clean pages, minimal pencil underlines in Chapter 4. Essential for Algorithms & placement prep.',
    sellerName: 'Mochi_14 (CSE 4th Yr)',
    contactInfo: 'mochi14@campus.example',
    imageUrl: ''
  },
  {
    itemName: 'Btwin MyBike 26T Campus Commuter Cycle',
    category: 'Cycles',
    condition: 'Good',
    ageInMonths: 20,
    originalPrice: 8200,
    suggestedPrice: 4350,
    sellingPrice: 4200,
    description: 'Recently serviced brakes and new rear tube. Comes with number lock and front basket.',
    sellerName: 'Pixel_Fox (ME 4th Yr)',
    contactInfo: 'pixelfox@campus.example',
    imageUrl: ''
  },
  {
    itemName: 'Arduino Uno R3 + Breadboard Sensor Kit',
    category: 'Electronics',
    condition: 'Like New',
    ageInMonths: 6,
    originalPrice: 2200,
    suggestedPrice: 1340,
    sellingPrice: 1300,
    description: 'Used for a single IoT hackathon project. All ultrasonic sensors, jumper wires, and USB cable intact.',
    sellerName: 'Koala_08 (EEE 3rd Yr)',
    contactInfo: 'koala08@campus.example',
    imageUrl: ''
  },
  {
    itemName: 'Foldable Wooden Hostel Study Table',
    category: 'Furniture',
    condition: 'Good',
    ageInMonths: 22,
    originalPrice: 1800,
    suggestedPrice: 840,
    sellingPrice: 800,
    description: 'Sturdy metal legs, cup-holder slot, folds flat under hostel bed.',
    sellerName: 'Otter_91 (CE 4th Yr)',
    contactInfo: 'otter91@campus.example',
    imageUrl: ''
  },
  {
    itemName: 'Mini Drafter & Engineering Drawing Board',
    category: 'Lab Equipment',
    condition: 'Excellent',
    ageInMonths: 12,
    originalPrice: 1450,
    suggestedPrice: 920,
    sellingPrice: 900,
    description: 'Complete first-year Engineering Graphics kit with carrying tube.',
    sellerName: 'Maple_42 (Civil 2nd Yr)',
    contactInfo: 'maple42@campus.example',
    imageUrl: ''
  }
];

const DEFAULT_WANTED = [
  {
    itemName: 'Casio fx-991ES Plus Scientific Calculator',
    category: 'Calculators',
    maxBudget: 750,
    description: 'Need before mid-sem exams next week. Looking for Good or Excellent condition.',
    requestedBy: 'Sprout_19 (CSE 1st Yr)',
    contactInfo: 'sprout19@campus.example'
  },
  {
    itemName: 'Single Speed Campus Cycle (26T)',
    category: 'Cycles',
    maxBudget: 4500,
    description: 'Prefer a working lock and good tyres for daily hostel-to-department commute.',
    requestedBy: 'Boba_33 (BT 1st Yr)',
    contactInfo: 'boba33@campus.example'
  },
  {
    itemName: 'Engineering Drawing Mini Drafter',
    category: 'Lab Equipment',
    maxBudget: 800,
    description: 'Required for Monday morning workshop lab.',
    requestedBy: 'Finch_05 (ME 1st Yr)',
    contactInfo: 'finch05@campus.example'
  }
];

function seedData(db) {
  const histCountRow = db.prepare('SELECT COUNT(*) AS count FROM historical_transactions').get();
  if (histCountRow.count < 200) {
    const records = buildHistoricalTransactions();
    const insertHist = db.prepare(`
      INSERT INTO historical_transactions
        (item_name, category, condition_grade, age_in_months, original_price, sold_price, resale_ratio)
      VALUES
        (@itemName, @category, @condition, @ageInMonths, @originalPrice, @soldPrice, @resaleRatio)
    `);

    const runSeed = db.transaction((items) => {
      db.prepare('DELETE FROM historical_transactions').run();
      for (const item of items) {
        insertHist.run(item);
      }
    });
    runSeed(records);
    console.log(`[Seed] Populated ${records.length} historical transactions in SQLite.`);
  } else {
    console.log(`[Seed] Historical transactions already present (${histCountRow.count} rows). Skipping duplicate seed.`);
  }

  const listingsCountRow = db.prepare('SELECT COUNT(*) AS count FROM listings').get();
  if (listingsCountRow.count === 0) {
    const insertListing = db.prepare(`
      INSERT INTO listings
        (item_name, category, condition_grade, age_in_months, original_price, suggested_price, selling_price, description, seller_name, contact_info, image_url)
      VALUES
        (@itemName, @category, @condition, @ageInMonths, @originalPrice, @suggestedPrice, @sellingPrice, @description, @sellerName, @contactInfo, @imageUrl)
    `);
    const insertMany = db.transaction((items) => {
      for (const item of items) insertListing.run(item);
    });
    insertMany(DEFAULT_LISTINGS);
    console.log(`[Seed] Populated ${DEFAULT_LISTINGS.length} initial campus listings.`);
  }

  const wantedCountRow = db.prepare('SELECT COUNT(*) AS count FROM wanted_requests').get();
  if (wantedCountRow.count === 0) {
    const insertWanted = db.prepare(`
      INSERT INTO wanted_requests
        (item_name, category, max_budget, description, requested_by, contact_info)
      VALUES
        (@itemName, @category, @maxBudget, @description, @requestedBy, @contactInfo)
    `);
    const insertMany = db.transaction((items) => {
      for (const item of items) insertWanted.run(item);
    });
    insertMany(DEFAULT_WANTED);
    console.log(`[Seed] Populated ${DEFAULT_WANTED.length} initial wanted requests.`);
  }
}

if (require.main === module) {
  const db = initDatabase();
  seedData(db);
  console.log('[Seed] Standalone seed finished.');
}

module.exports = {
  seedData,
  buildHistoricalTransactions
};

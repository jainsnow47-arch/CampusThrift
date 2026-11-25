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

const DEMO_USERS = [
  { handle: 'Panda_27', avatarEmoji: '🐼', department: 'ECE 3rd Yr (Demo)', isVerified: 1 },
  { handle: 'Mochi_14', avatarEmoji: '🍡', department: 'CSE 4th Yr (Demo)', isVerified: 1 },
  { handle: 'Pixel_Fox', avatarEmoji: '🦊', department: 'ME 4th Yr (Demo)', isVerified: 0 },
  { handle: 'Koala_08', avatarEmoji: '🐨', department: 'EEE 3rd Yr (Demo)', isVerified: 1 },
  { handle: 'Otter_91', avatarEmoji: '🦦', department: 'CE 2nd Yr (Demo)', isVerified: 0 },
  { handle: 'Maple_42', avatarEmoji: '🍁', department: 'BT 1st Yr (Demo)', isVerified: 0 }
];

const DEFAULT_LISTINGS = [
  {
    handle: 'Panda_27',
    itemName: 'Casio fx-991EX ClassWiz Scientific Calculator',
    category: 'Calculators',
    condition: 'Excellent',
    ageInMonths: 14,
    originalPrice: 1350,
    suggestedPrice: 890,
    sellingPrice: 850,
    minAcceptablePrice: 750,
    willingToNegotiate: 1,
    transactionType: 'SELL',
    description: 'Used for two engineering semesters. Crisp display, solar + battery working 100%. Includes protective slide cover.',
    collectionLocation: 'Central Library Porch'
  },
  {
    handle: 'Mochi_14',
    itemName: 'CLRS Introduction to Algorithms (3rd Edition)',
    category: 'Books',
    condition: 'Good',
    ageInMonths: 18,
    originalPrice: 1450,
    suggestedPrice: 680,
    sellingPrice: 650,
    minAcceptablePrice: 550,
    willingToNegotiate: 1,
    transactionType: 'SELL',
    description: 'Clean pages, minimal pencil underlines in Chapter 4. Essential for Algorithms & placement prep.',
    collectionLocation: 'CSE Department Lobby'
  },
  {
    handle: 'Pixel_Fox',
    itemName: 'Btwin MyBike 26T Campus Commuter Cycle',
    category: 'Cycles',
    condition: 'Good',
    ageInMonths: 20,
    originalPrice: 8200,
    suggestedPrice: 4350,
    sellingPrice: 4200,
    minAcceptablePrice: 3800,
    willingToNegotiate: 1,
    transactionType: 'SELL',
    description: 'Recently serviced brakes and new rear tube. Comes with number lock and front basket.',
    collectionLocation: 'Hostel B Cycle Stand'
  },
  {
    handle: 'Koala_08',
    itemName: 'Arduino Uno R3 + Breadboard Sensor Kit',
    category: 'Electronics',
    condition: 'Like New',
    ageInMonths: 6,
    originalPrice: 2200,
    suggestedPrice: null,
    sellingPrice: 0,
    transactionType: 'BORROW',
    minDurationDays: 3,
    maxDurationDays: 14,
    refundableDeposit: 300,
    collectionLocation: 'Innovation Tinkering Lab',
    specialConditions: 'Return with all jumper wires & ultrasonic sensor intact.',
    description: 'Free temporary lend for 1st/2nd year hackathon or lab projects.'
  },
  {
    handle: 'Otter_91',
    itemName: 'Acoustic Guitar 38-inch Beginner Kit',
    category: 'Other',
    condition: 'Good',
    ageInMonths: 16,
    originalPrice: 4500,
    suggestedPrice: null,
    sellingPrice: 0,
    transactionType: 'SWAP',
    swapFor: 'Ergonomic Study Chair or Wireless Headphones',
    allowMultipleSwaps: 1,
    collectionLocation: 'Student Activity Center',
    description: 'Clean frets, spare set of strings included. Looking to swap for dorm gear or audio gear.'
  },
  {
    handle: 'Maple_42',
    itemName: 'Mini Drafter & Engineering Drawing Board',
    category: 'Lab Equipment',
    condition: 'Excellent',
    ageInMonths: 12,
    originalPrice: 1450,
    suggestedPrice: null,
    sellingPrice: 40,
    rentalPricePerDay: 40,
    minDurationDays: 2,
    maxDurationDays: 21,
    refundableDeposit: 200,
    transactionType: 'RENT',
    collectionLocation: 'Mechanical Workshop Block',
    specialConditions: 'Keep scales clean; return in carrying tube.',
    description: 'Rent per day for Engineering Graphics labs or end-sem drawing practicals.'
  }
];

const DEFAULT_WANTED = [
  {
    itemName: 'Casio fx-991ES Plus Scientific Calculator',
    category: 'Calculators',
    maxBudget: 750,
    description: 'Need before mid-sem exams next week. Looking for Good or Excellent condition.',
    requestedBy: 'Sprout_19 🌱',
    contactInfo: 'sprout19@campus.example'
  },
  {
    itemName: 'Single Speed Campus Cycle (26T)',
    category: 'Cycles',
    maxBudget: 4500,
    description: 'Prefer a working lock and good tyres for daily hostel-to-department commute.',
    requestedBy: 'Boba_33 🧋',
    contactInfo: 'boba33@campus.example'
  },
  {
    itemName: 'Engineering Drawing Mini Drafter',
    category: 'Lab Equipment',
    maxBudget: 800,
    description: 'Required for Monday morning workshop lab.',
    requestedBy: 'Finch_05 🐦',
    contactInfo: 'finch05@campus.example'
  }
];

function seedData(db) {
  // 1. Historical 200 rows (idempotent)
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
      for (const item of items) insertHist.run(item);
    });
    runSeed(records);
    console.log(`[Seed] Populated ${records.length} historical transactions in SQLite.`);
  } else {
    console.log(`[Seed] Historical transactions already present (${histCountRow.count} rows). Skipping duplicate seed.`);
  }

  // 2. Demo pseudonymous users (idempotent)
  const userCountRow = db.prepare('SELECT COUNT(*) AS count FROM users').get();
  if (userCountRow.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (handle, avatar_emoji, department, is_demo, is_verified)
      VALUES (@handle, @avatarEmoji, @department, 1, @isVerified)
    `);
    const insertUsers = db.transaction((users) => {
      for (const u of users) insertUser.run(u);
    });
    insertUsers(DEMO_USERS);
  }

  const userRows = db.prepare('SELECT id, handle, avatar_emoji FROM users').all();
  const userMap = new Map(userRows.map((u) => [u.handle, u]));
  const fallbackUser = userRows[0];

  // 3. Listings (seed initial set if empty, OR upgrade legacy rows with seller_id & add sample SWAP/BORROW/RENT if none exist)
  const listingsCountRow = db.prepare('SELECT COUNT(*) AS count FROM listings').get();
  const insertListing = db.prepare(`
    INSERT INTO listings (
      seller_id, item_name, category, condition_grade, age_in_months, original_price,
      suggested_price, selling_price, min_acceptable_price, willing_to_negotiate,
      transaction_type, availability_status, swap_for, allow_multiple_swaps,
      rental_price_per_day, min_duration_days, max_duration_days, refundable_deposit,
      collection_location, special_conditions, description, seller_name, contact_info, image_url
    ) VALUES (
      @sellerId, @itemName, @category, @condition, @ageInMonths, @originalPrice,
      @suggestedPrice, @sellingPrice, @minAcceptablePrice, @willingToNegotiate,
      @transactionType, 'AVAILABLE', @swapFor, @allowMultipleSwaps,
      @rentalPricePerDay, @minDurationDays, @maxDurationDays, @refundableDeposit,
      @collectionLocation, @specialConditions, @description, @sellerName, @contactInfo, ''
    )
  `);

  if (listingsCountRow.count === 0) {
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        const u = userMap.get(item.handle) || fallbackUser;
        insertListing.run({
          sellerId: u.id,
          itemName: item.itemName,
          category: item.category,
          condition: item.condition,
          ageInMonths: item.ageInMonths,
          originalPrice: item.originalPrice,
          suggestedPrice: item.suggestedPrice ?? null,
          sellingPrice: item.sellingPrice ?? 0,
          minAcceptablePrice: item.minAcceptablePrice ?? null,
          willingToNegotiate: item.willingToNegotiate ?? 1,
          transactionType: item.transactionType,
          swapFor: item.swapFor || '',
          allowMultipleSwaps: item.allowMultipleSwaps ?? 1,
          rentalPricePerDay: item.rentalPricePerDay ?? null,
          minDurationDays: item.minDurationDays ?? null,
          maxDurationDays: item.maxDurationDays ?? null,
          refundableDeposit: item.refundableDeposit ?? 0,
          collectionLocation: item.collectionLocation || '',
          specialConditions: item.specialConditions || '',
          description: item.description || '',
          sellerName: `${u.handle} ${u.avatar_emoji}`,
          contactInfo: `${u.handle.toLowerCase()}@campus.example`
        });
      }
    });
    insertMany(DEFAULT_LISTINGS);
    console.log(`[Seed] Populated ${DEFAULT_LISTINGS.length} initial unified listings.`);
  } else {
    // Safe backward compatibility: ensure existing legacy rows have seller_id & transaction_type
    if (fallbackUser) {
      db.prepare(
        `UPDATE listings SET seller_id = ?, seller_name = COALESCE(NULLIF(seller_name, ''), ?) WHERE seller_id IS NULL`
      ).run(fallbackUser.id, `${fallbackUser.handle} ${fallbackUser.avatar_emoji}`);
    }
    // Add one sample SWAP/BORROW/RENT if only SELL listings existed before Phase 1 migration
    const nonSellCount = db.prepare("SELECT COUNT(*) AS c FROM listings WHERE transaction_type != 'SELL'").get().c;
    if (nonSellCount === 0) {
      const extraTypes = DEFAULT_LISTINGS.filter((d) => d.transactionType !== 'SELL');
      const insertExtras = db.transaction((items) => {
        for (const item of items) {
          const u = userMap.get(item.handle) || fallbackUser;
          insertListing.run({
            sellerId: u.id,
            itemName: item.itemName,
            category: item.category,
            condition: item.condition,
            ageInMonths: item.ageInMonths,
            originalPrice: item.originalPrice,
            suggestedPrice: item.suggestedPrice ?? null,
            sellingPrice: item.sellingPrice ?? 0,
            minAcceptablePrice: null,
            willingToNegotiate: 0,
            transactionType: item.transactionType,
            swapFor: item.swapFor || '',
            allowMultipleSwaps: item.allowMultipleSwaps ?? 1,
            rentalPricePerDay: item.rentalPricePerDay ?? null,
            minDurationDays: item.minDurationDays ?? null,
            maxDurationDays: item.maxDurationDays ?? null,
            refundableDeposit: item.refundableDeposit ?? 0,
            collectionLocation: item.collectionLocation || '',
            specialConditions: item.specialConditions || '',
            description: item.description || '',
            sellerName: `${u.handle} ${u.avatar_emoji}`,
            contactInfo: `${u.handle.toLowerCase()}@campus.example`
          });
        }
      });
      insertExtras(extraTypes);
      console.log('[Seed] Added sample SWAP, BORROW, and RENT listings for Phase 1.');
    }
  }

  // 4. Wanted requests (idempotent)
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

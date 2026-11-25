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
  { handle: 'Panda_27', avatarEmoji: '🐼', department: 'CSE Block • Synthetic Demo', isVerified: 1 },
  { handle: 'Mochi_14', avatarEmoji: '🍡', department: 'ECE Wing • Synthetic Demo', isVerified: 1 },
  { handle: 'Pixel_Fox', avatarEmoji: '🦊', department: 'IT Hostel • Synthetic Demo', isVerified: 0 },
  { handle: 'Koala_88', avatarEmoji: '🐨', department: 'Mech Quad • Synthetic Demo', isVerified: 1 },
  { handle: 'Sprout_09', avatarEmoji: '🌱', department: 'Civil Dept • Synthetic Demo', isVerified: 0 },
  { handle: 'Otter_42', avatarEmoji: '🦦', department: 'Biotech Lab • Synthetic Demo', isVerified: 1 },
  { handle: 'Boba_19', avatarEmoji: '🧋', department: 'Library Hub • Synthetic Demo', isVerified: 0 },
  { handle: 'Lynx_64', avatarEmoji: '🐱', department: 'EE Dorm • Synthetic Demo', isVerified: 1 },
  { handle: 'BinaryBard', avatarEmoji: '🧭', department: 'ALL • Synthetic Demo', isVerified: 1 },
  { handle: 'SolderPro', avatarEmoji: '🧩', department: 'ECE • Synthetic Demo', isVerified: 1 },
  { handle: 'PixelPanda', avatarEmoji: '🦊', department: 'ME • Synthetic Demo', isVerified: 1 }
];

const DEFAULT_LISTINGS = [
  {
    handle: 'BinaryBard',
    itemName: 'White Cotton Chemistry Lab Coat (Size M)',
    category: 'Lab Equipment',
    condition: 'Like New',
    ageInMonths: 12,
    originalPrice: 650,
    suggestedPrice: null,
    sellingPrice: 0,
    transactionType: 'BORROW',
    minDurationDays: 1,
    maxDurationDays: 7,
    refundableDeposit: 0,
    collectionLocation: 'Chemistry Block Locker 4',
    specialConditions: 'Return washed and buttoned after lab week.',
    description: 'Clean cotton chemistry & engineering lab coat. Borrow free for weekly practicals.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
  },
  {
    handle: 'SolderPro',
    itemName: 'Arduino Uno + Jumper & Breadboard Kit',
    category: 'Electronics',
    condition: 'Good',
    ageInMonths: 18,
    originalPrice: 1850,
    suggestedPrice: null,
    sellingPrice: 0,
    transactionType: 'BORROW',
    minDurationDays: 2,
    maxDurationDays: 10,
    refundableDeposit: 200,
    collectionLocation: 'Robotics Club Cupboard',
    specialConditions: 'Return with all jumper wires and USB cable intact.',
    description: 'Tested Arduino kit with breadboard and sensors for ECE/IoT mini-projects.',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80'
  },
  {
    handle: 'PixelPanda',
    itemName: 'Casio fx-991EX ClassWiz',
    category: 'Calculators',
    condition: 'Good',
    ageInMonths: 24,
    originalPrice: 1200,
    suggestedPrice: 700,
    sellingPrice: 780,
    minAcceptablePrice: 680,
    willingToNegotiate: 1,
    transactionType: 'SELL',
    collectionLocation: 'ME Dept Foyer',
    description: 'High-res LCD scientific calculator with solar cell. Dialed in for semester equations.',
    imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80'
  },
  {
    handle: 'Mochi_14',
    itemName: 'Hero Sprint 26T Mountain Gear Bicycle',
    category: 'Cycles',
    condition: 'Good',
    ageInMonths: 18,
    originalPrice: 7200,
    suggestedPrice: 4200,
    sellingPrice: 4000,
    minAcceptablePrice: 3600,
    willingToNegotiate: 1,
    transactionType: 'SELL',
    collectionLocation: 'Hostel Block B Cycle Stand',
    description: '21-speed Shimano gears, newly installed brake pads and front basket. Smooth ride across campus.',
    imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80'
  },
  {
    handle: 'Pixel_Fox',
    itemName: 'Introduction to Algorithms (CLRS 3rd Edition)',
    category: 'Books',
    condition: 'Like New',
    ageInMonths: 8,
    originalPrice: 1450,
    suggestedPrice: null,
    sellingPrice: 0,
    transactionType: 'SWAP',
    swapFor: 'Operating Systems (Silberschatz) or Arduino Starter Kit',
    allowMultipleSwaps: 1,
    collectionLocation: 'CSE Department Foyer',
    description: 'Pristine condition with zero pencil markings. Looking to swap for 4th-sem textbooks or electronics kits.',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
  },
  {
    handle: 'Koala_88',
    itemName: 'Logitech MK270 Wireless Keyboard & Mouse Combo',
    category: 'Electronics',
    condition: 'Good',
    ageInMonths: 16,
    originalPrice: 1899,
    suggestedPrice: null,
    sellingPrice: 35,
    rentalPricePerDay: 35,
    minDurationDays: 3,
    maxDurationDays: 30,
    refundableDeposit: 300,
    transactionType: 'RENT',
    collectionLocation: 'Main Gate Student Lounge',
    specialConditions: 'Return with USB receiver and working batteries.',
    description: 'Ideal for hackathon weekends or temporary desk setups. Weekly/monthly student-friendly rates.',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80'
  },
  {
    handle: 'Sprout_09',
    itemName: 'Green Soul Ergonomic Study Desk Chair',
    category: 'Furniture',
    condition: 'Excellent',
    ageInMonths: 12,
    originalPrice: 5990,
    suggestedPrice: 3800,
    sellingPrice: 3750,
    minAcceptablePrice: 3300,
    willingToNegotiate: 1,
    transactionType: 'SELL',
    collectionLocation: 'Hostel Block C Lobby',
    description: 'Breathable mesh back with adjustable lumbar support and height adjustment. Saved my back during exam season.',
    imageUrl: 'https://images.unsplash.com/photo-1580481077195-c9f280a58145?auto=format&fit=crop&w=600&q=80'
  },
  {
    handle: 'Otter_42',
    itemName: 'Mini Drafter & Engineering Drawing Board Set',
    category: 'Lab Equipment',
    condition: 'Good',
    ageInMonths: 20,
    originalPrice: 1200,
    suggestedPrice: null,
    sellingPrice: 0,
    transactionType: 'BORROW',
    minDurationDays: 1,
    maxDurationDays: 14,
    refundableDeposit: 150,
    collectionLocation: 'Mechanical Workshop Desk',
    specialConditions: 'Free lending for 1st-year studio sessions. Keep scale clamp intact.',
    description: 'Complete with scale clamp and carry case. Borrow free for your Engineering Graphics assignments!',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
  },
  {
    handle: 'Boba_19',
    itemName: 'Prestige 1.5L Stainless Steel Electric Kettle',
    category: 'Other',
    condition: 'Like New',
    ageInMonths: 6,
    originalPrice: 995,
    suggestedPrice: 650,
    sellingPrice: 650,
    minAcceptablePrice: 550,
    willingToNegotiate: 0,
    transactionType: 'SELL',
    collectionLocation: 'Girls Hostel Gate',
    description: 'Boils in under 2 minutes. Automatic cut-off. Essential for late-night noodles and coffee.',
    imageUrl: 'https://images.unsplash.com/photo-1544003484-3cd181d17917?auto=format&fit=crop&w=600&q=80'
  },
  {
    handle: 'Lynx_64',
    itemName: 'Higher Engineering Mathematics - B.S. Grewal',
    category: 'Books',
    condition: 'Good',
    ageInMonths: 22,
    originalPrice: 850,
    suggestedPrice: null,
    sellingPrice: 0,
    transactionType: 'BORROW',
    minDurationDays: 7,
    maxDurationDays: 45,
    refundableDeposit: 0,
    collectionLocation: 'Central Library Steps',
    specialConditions: 'No highlighting or dog-earing pages please.',
    description: 'Covers M1, M2, and M3 modules completely. Free semester exam borrow for juniors.',
    imageUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=600&q=80'
  }
];

const DEFAULT_WANTED = [
  {
    itemName: 'Second-hand Scientific Calculator fx-991EX',
    category: 'Calculators',
    maxBudget: 750,
    description: 'Urgent! Need a working Casio scientific calculator for upcoming mid-semester engineering exams.',
    requestedBy: 'Pixel_Fox 🦊',
    contactInfo: 'pixelfox@campus.example'
  },
  {
    itemName: 'Campus Commuter Bicycle (Gear or Single Speed)',
    category: 'Cycles',
    maxBudget: 3500,
    description: 'Looking for a reliable cycle to travel between hostel block C and academic departments.',
    requestedBy: 'Sprout_09 🌱',
    contactInfo: 'sprout09@campus.example'
  },
  {
    itemName: 'Engineering Graphics Mini Drafter & Clips',
    category: 'Lab Equipment',
    maxBudget: 500,
    description: 'First year student looking for an intact mini drafter for weekly drawing studio sessions.',
    requestedBy: 'Boba_19 🧋',
    contactInfo: 'boba19@campus.example'
  },
  {
    itemName: 'Ergonomic Desk Chair or Folding Study Table',
    category: 'Furniture',
    maxBudget: 1500,
    description: 'Looking for a sturdy chair or compact study table for hostel room.',
    requestedBy: 'Mochi_14 🍡',
    contactInfo: 'mochi14@campus.example'
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

  // 2. Demo pseudonymous users (idempotent by handle)
  const upsertDemoUser = db.prepare(`
    INSERT OR IGNORE INTO users (handle, avatar_emoji, department, is_demo, is_verified)
    VALUES (@handle, @avatarEmoji, @department, 1, @isVerified)
  `);
  const insertUsers = db.transaction((users) => {
    for (const u of users) upsertDemoUser.run(u);
  });
  insertUsers(DEMO_USERS);

  const userRows = db.prepare('SELECT id, handle, avatar_emoji FROM users').all();
  const userMap = new Map(userRows.map((u) => [u.handle, u]));
  const fallbackUser = userRows[0];

  // 3. Seed unified dummy listings without duplicating existing items
  const existingRows = db.prepare('SELECT id, item_name AS itemName, image_url AS imageUrl FROM listings').all();
  const existingByName = new Map(existingRows.map((r) => [String(r.itemName).toLowerCase(), r]));

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
      @collectionLocation, @specialConditions, @description, @sellerName, @contactInfo, @imageUrl
    )
  `);
  const updateImageStmt = db.prepare('UPDATE listings SET image_url = ? WHERE id = ? AND (image_url IS NULL OR image_url = \'\')');

  if (fallbackUser) {
    db.prepare(
      `UPDATE listings SET seller_id = ?, seller_name = COALESCE(NULLIF(seller_name, ''), ?) WHERE seller_id IS NULL`
    ).run(fallbackUser.id, `${fallbackUser.handle} ${fallbackUser.avatar_emoji}`);
  }

  let addedListings = 0;
  const seedListingsTx = db.transaction((items) => {
    for (const item of items) {
      const existing = existingByName.get(item.itemName.toLowerCase());
      if (existing) {
        if (!existing.imageUrl && item.imageUrl) {
          updateImageStmt.run(item.imageUrl, existing.id);
        }
        continue;
      }
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
        contactInfo: `${u.handle.toLowerCase()}@campus.example`,
        imageUrl: item.imageUrl || ''
      });
      addedListings += 1;
    }
  });
  seedListingsTx(DEFAULT_LISTINGS);
  if (addedListings > 0) {
    console.log(`[Seed] Added ${addedListings} showcase unified listings.`);
  }

  // 4. Wanted requests (idempotent by item_name)
  const existingWantedNames = new Set(
    db.prepare('SELECT item_name AS itemName FROM wanted_requests').all().map((w) => String(w.itemName).toLowerCase())
  );
  const insertWanted = db.prepare(`
    INSERT INTO wanted_requests
      (item_name, category, max_budget, description, requested_by, contact_info)
    VALUES
      (@itemName, @category, @maxBudget, @description, @requestedBy, @contactInfo)
  `);
  const insertWantedTx = db.transaction((items) => {
    for (const item of items) {
      if (!existingWantedNames.has(item.itemName.toLowerCase())) {
        insertWanted.run(item);
      }
    }
  });
  insertWantedTx(DEFAULT_WANTED);
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

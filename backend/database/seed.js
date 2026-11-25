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
  },
  {
    handle: 'PixelPanda',
    itemName: 'Navy Tailored Interview Blazer & Formal Shirt (Size M)',
    category: 'Other',
    condition: 'Like New',
    ageInMonths: 10,
    originalPrice: 3400,
    suggestedPrice: 1200,
    sellingPrice: 1100,
    minAcceptablePrice: 950,
    willingToNegotiate: 1,
    transactionType: 'SELL',
    collectionLocation: 'Placement Cell Corridor',
    description: 'Worn twice for final-year campus placement interviews. Dry-cleaned blazer + crisp white formal shirt.',
    imageUrl: ''
  },
  {
    handle: 'Mochi_14',
    itemName: 'Festive Mirror-Work Kurta & Dandiya Sticks Set',
    category: 'Other',
    condition: 'Excellent',
    ageInMonths: 12,
    originalPrice: 1600,
    suggestedPrice: null,
    sellingPrice: 60,
    rentalPricePerDay: 60,
    minDurationDays: 1,
    maxDurationDays: 4,
    refundableDeposit: 200,
    transactionType: 'RENT',
    collectionLocation: 'Cultural Club Room, Block A',
    specialConditions: 'Return dry/clean after Dandiya Night weekend.',
    description: 'Bright festive kurta with matching wooden dandiya sticks and dupatta accessory set.',
    imageUrl: ''
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

function datePlusDays(daysFromNow) {
  const dt = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return dt.toISOString().slice(0, 10);
}

function makeEventSvg(bgColor, accentColor, labelText, iconSvg) {
  return (
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 180"><rect width="400" height="180" fill="${bgColor}"/><rect x="18" y="18" width="364" height="144" rx="14" fill="#FFFDF8" stroke="#111111" stroke-width="5"/><rect x="18" y="18" width="364" height="36" rx="10" fill="${accentColor}" stroke="#111111" stroke-width="5"/><text x="34" y="42" font-family="monospace" font-size="14" font-weight="bold" fill="#111111">${labelText}</text>${iconSvg}</svg>`
    )
  );
}

function buildConfiguredEvents() {
  return [
    {
      slug: 'semester-examinations',
      eventName: 'Semester Examinations',
      eventDate: datePlusDays(4),
      description: 'End-semester engineering & science exams begin across all lecture halls. Grab scientific calculators and core textbooks.',
      bannerMessage: 'Semester examinations are approaching! Borrow or buy calculators and textbooks from seniors.',
      relevantCategories: JSON.stringify(['Calculators', 'Books']),
      keywords: JSON.stringify(['calculator', 'fx-991', 'mathematics', 'grewal', 'algorithms', 'clrs']),
      imageUrl: makeEventSvg('#BFE8C9', '#FFC93C', 'EXAMS PREP', '<rect x="155" y="72" width="90" height="72" rx="10" fill="#3CC4B3" stroke="#111111" stroke-width="4"/><text x="200" y="116" font-family="monospace" font-size="22" font-weight="bold" fill="#111111" text-anchor="middle">fx-991</text>')
    },
    {
      slug: 'placement-drive',
      eventName: 'Campus Placement Drive',
      eventDate: datePlusDays(7),
      description: 'Pre-placement talks and technical interviews start next week. Surface pre-loved blazers, formal shirts, trousers, shoes, and DSA prep books.',
      bannerMessage: 'Placement drive is coming! Explore pre-loved blazers, formal shirts, and interview prep guides.',
      relevantCategories: JSON.stringify(['Other', 'Books']),
      keywords: JSON.stringify(['blazer', 'formal', 'shirt', 'trouser', 'shoes', 'interview', 'algorithms', 'clrs']),
      imageUrl: makeEventSvg('#F9C9B0', '#4C9BE8', 'CAREER & INTERVIEWS', '<polygon points="165,78 200,98 235,78 248,144 152,144" fill="#111111"/><polygon points="188,88 200,132 212,88" fill="#FFC93C"/>')
    },
    {
      slug: 'dandiya-night',
      eventName: 'Dandiya Night',
      eventDate: datePlusDays(11),
      description: 'Annual campus Garba & Dandiya evening at the Main Quad. Rent or swap traditional kurtas, ethnic accessories, and dandiya sticks.',
      bannerMessage: 'Dandiya night is coming! Explore pre-loved outfits and accessories from your campus.',
      relevantCategories: JSON.stringify(['Other']),
      keywords: JSON.stringify(['dandiya', 'kurta', 'festive', 'ethnic', 'outfit', 'accessories']),
      imageUrl: makeEventSvg('#F7A8C4', '#FFC93C', 'CULTURAL NIGHT', '<line x1="150" y1="140" x2="225" y2="72" stroke="#111111" stroke-width="9" stroke-linecap="round"/><line x1="250" y1="140" x2="175" y2="72" stroke="#111111" stroke-width="9" stroke-linecap="round"/><circle cx="200" cy="106" r="10" fill="#3CC4B3" stroke="#111111" stroke-width="3"/>')
    },
    {
      slug: 'campus-hackathon',
      eventName: 'BuildSprint 24h Hackathon',
      eventDate: datePlusDays(16),
      description: 'Overnight campus coding & hardware sprint. Borrow Arduino kits, wireless keyboards, and dorm kettles for your team.',
      bannerMessage: 'BuildSprint Hackathon is coming! Borrow Arduino kits, keyboards, and kettles on campus.',
      relevantCategories: JSON.stringify(['Electronics', 'Other']),
      keywords: JSON.stringify(['arduino', 'keyboard', 'mouse', 'kettle', 'breadboard', 'electronics']),
      imageUrl: makeEventSvg('#9B7BEA', '#3CC4B3', '24H HACKATHON', '<rect x="140" y="76" width="120" height="66" rx="8" fill="#111111"/><text x="200" y="116" font-family="monospace" font-size="20" font-weight="bold" fill="#FFC93C" text-anchor="middle">&lt;/&gt; BUILD</text>')
    },
    {
      slug: 'college-fest',
      eventName: 'Annual College Festival',
      eventDate: datePlusDays(35),
      description: 'Three days of inter-college music, robotics, and campus stalls. Gear up with commuter cycles, electronics, and festive wear.',
      bannerMessage: 'College festival season is ahead! Browse cycles, electronics, and festival essentials.',
      relevantCategories: JSON.stringify(['Cycles', 'Electronics', 'Other']),
      keywords: JSON.stringify(['cycle', 'bicycle', 'arduino', 'kurta', 'kettle']),
      imageUrl: makeEventSvg('#FFC93C', '#F25F5C', 'COLLEGE FEST', '<circle cx="200" cy="110" r="32" fill="#3CC4B3" stroke="#111111" stroke-width="4"/><polygon points="200,85 207,103 226,103 211,114 216,132 200,121 184,132 189,114 174,103 193,103" fill="#FFC93C" stroke="#111111" stroke-width="2.5"/>')
    },
    {
      slug: 'senior-farewell',
      eventName: 'Senior Farewell & Move-Out',
      eventDate: datePlusDays(65),
      description: 'Graduating seniors pass on hostel furniture, bicycles, kettles, and formal wear before leaving campus.',
      bannerMessage: 'Farewell & move-out season is coming! Watch for hostel chairs, bicycles, and blazers.',
      relevantCategories: JSON.stringify(['Furniture', 'Cycles', 'Other', 'Books']),
      keywords: JSON.stringify(['chair', 'desk', 'cycle', 'blazer', 'kettle', 'bicycle']),
      imageUrl: makeEventSvg('#3CC4B3', '#FFC93C', 'FAREWELL WEEK', '<path d="M150 112 L200 78 L250 112 L200 132 Z" fill="#111111"/><rect x="175" y="120" width="50" height="22" rx="4" fill="#9B7BEA" stroke="#111111" stroke-width="3"/>')
    }
  ];
}

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

  // 5. Configured Campus Events (idempotent by slug)
  const configuredEvents = buildConfiguredEvents();
  const upsertEvent = db.prepare(`
    INSERT OR IGNORE INTO campus_events
      (slug, event_name, event_date, description, banner_message, relevant_categories, keywords, image_url)
    VALUES
      (@slug, @eventName, @eventDate, @description, @bannerMessage, @relevantCategories, @keywords, @imageUrl)
  `);
  const seedEventsTx = db.transaction((events) => {
    for (const ev of events) upsertEvent.run(ev);
  });
  seedEventsTx(configuredEvents);

  // 6. Seed realistic completed demo transactions + ratings (only when transactions table is empty)
  const txCountRow = db.prepare('SELECT COUNT(*) AS count FROM transactions').get();
  if (txCountRow.count === 0) {
    const findUser = (h) => db.prepare('SELECT id FROM users WHERE handle = ?').get(h)?.id;
    const findListing = (name) =>
      db.prepare('SELECT id, seller_id AS sellerId, transaction_type AS transactionType, selling_price AS sellingPrice FROM listings WHERE item_name = ?').get(name);

    const pandaId = findUser('Panda_27');
    const mochiId = findUser('Mochi_14');
    const pixelFoxId = findUser('Pixel_Fox');
    const otterId = findUser('Otter_42');

    const calcListing = findListing('Casio fx-991EX ClassWiz');
    const coatListing = findListing('White Cotton Chemistry Lab Coat (Size M)');
    const clrsListing = findListing('Introduction to Algorithms (CLRS 3rd Edition)');

    const insertTx = db.prepare(`
      INSERT INTO transactions (
        listing_id, buyer_id, seller_id, transaction_type, status,
        proposed_price, swap_offer, note, buyer_confirmed, seller_confirmed, completed_at
      ) VALUES (?, ?, ?, ?, 'COMPLETED', ?, ?, ?, 1, 1, CURRENT_TIMESTAMP)
    `);
    const insertRating = db.prepare(`
      INSERT OR IGNORE INTO ratings (transaction_id, rater_id, ratee_id, score, feedback)
      VALUES (?, ?, ?, ?, ?)
    `);

    const seedTxAndRatings = db.transaction(() => {
      // Tx 1: Panda_27 bought Casio fx-991EX from PixelPanda -> completed, PixelPanda already rated Panda_27; Panda_27 can rate PixelPanda in UI!
      if (pandaId && calcListing && calcListing.sellerId && pandaId !== calcListing.sellerId) {
        const res1 = insertTx.run(
          calcListing.id,
          pandaId,
          calcListing.sellerId,
          'SELL',
          750,
          '',
          'Met outside ME Dept foyer after lab.',
        );
        insertRating.run(res1.lastInsertRowid, calcListing.sellerId, pandaId, 5, 'Punctual meetup and smooth UPI handover!');
      }

      // Tx 2: Mochi_14 borrowed Lab Coat from BinaryBard -> both rated 5 stars
      if (mochiId && coatListing && coatListing.sellerId && mochiId !== coatListing.sellerId) {
        const res2 = insertTx.run(
          coatListing.id,
          mochiId,
          coatListing.sellerId,
          'BORROW',
          0,
          '',
          'Borrowed for Thursday chemistry practical.'
        );
        insertRating.run(res2.lastInsertRowid, mochiId, coatListing.sellerId, 5, 'Spotless lab coat and super helpful pickup!');
        insertRating.run(res2.lastInsertRowid, coatListing.sellerId, mochiId, 5, 'Returned washed and right on time.');
      }

      // Tx 3: Otter_42 swapped with Pixel_Fox on CLRS book -> rated 5 stars
      if (otterId && pixelFoxId && clrsListing && clrsListing.sellerId && otterId !== clrsListing.sellerId) {
        const res3 = insertTx.run(
          clrsListing.id,
          otterId,
          clrsListing.sellerId,
          'SWAP',
          0,
          'Operating System Concepts (Silberschatz)',
          'Fair semester textbook swap at CSE lobby.'
        );
        insertRating.run(res3.lastInsertRowid, otterId, clrsListing.sellerId, 5, 'Book had zero highlights—awesome swap!');
      }
    });
    seedTxAndRatings();
    console.log('[Seed] Initialized configured campus events and completed demo transactions/ratings.');
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

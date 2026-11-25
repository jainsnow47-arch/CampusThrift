const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

let dbInstance = null;

function getDatabasePath() {
  if (process.env.DB_PATH && process.env.DB_PATH.trim()) {
    return path.resolve(process.cwd(), process.env.DB_PATH.trim());
  }
  return path.join(__dirname, '../database/reloop.sqlite');
}

function ensureUnifiedListingColumns(db) {
  const cols = db.prepare('PRAGMA table_info(listings)').all().map((c) => c.name);
  const migrations = [
    { name: 'seller_id', ddl: 'ALTER TABLE listings ADD COLUMN seller_id INTEGER' },
    { name: 'min_acceptable_price', ddl: 'ALTER TABLE listings ADD COLUMN min_acceptable_price REAL' },
    { name: 'willing_to_negotiate', ddl: 'ALTER TABLE listings ADD COLUMN willing_to_negotiate INTEGER NOT NULL DEFAULT 1' },
    { name: 'transaction_type', ddl: "ALTER TABLE listings ADD COLUMN transaction_type TEXT NOT NULL DEFAULT 'SELL'" },
    { name: 'availability_status', ddl: "ALTER TABLE listings ADD COLUMN availability_status TEXT NOT NULL DEFAULT 'AVAILABLE'" },
    { name: 'swap_for', ddl: "ALTER TABLE listings ADD COLUMN swap_for TEXT DEFAULT ''" },
    { name: 'allow_multiple_swaps', ddl: 'ALTER TABLE listings ADD COLUMN allow_multiple_swaps INTEGER NOT NULL DEFAULT 1' },
    { name: 'rental_price_per_day', ddl: 'ALTER TABLE listings ADD COLUMN rental_price_per_day REAL' },
    { name: 'min_duration_days', ddl: 'ALTER TABLE listings ADD COLUMN min_duration_days INTEGER' },
    { name: 'max_duration_days', ddl: 'ALTER TABLE listings ADD COLUMN max_duration_days INTEGER' },
    { name: 'refundable_deposit', ddl: 'ALTER TABLE listings ADD COLUMN refundable_deposit REAL DEFAULT 0' },
    { name: 'collection_location', ddl: "ALTER TABLE listings ADD COLUMN collection_location TEXT DEFAULT ''" },
    { name: 'special_conditions', ddl: "ALTER TABLE listings ADD COLUMN special_conditions TEXT DEFAULT ''" }
  ];

  for (const m of migrations) {
    if (!cols.includes(m.name)) {
      db.exec(m.ddl);
    }
  }

  // Upgrade legacy Step 1 CHECK (selling_price > 0) constraint so SWAP and BORROW can store selling_price = 0
  const tableDef = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'listings'")
    .get();
  if (tableDef && /selling_price\s+REAL[^,]*CHECK\s*\(\s*selling_price\s*>\s*0\s*\)/i.test(tableDef.sql)) {
    db.pragma('foreign_keys = OFF');
    const migrateTx = db.transaction(() => {
      db.exec(`
        CREATE TABLE listings_v2 (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          seller_id INTEGER,
          item_name TEXT NOT NULL,
          category TEXT NOT NULL,
          condition_grade TEXT NOT NULL,
          age_in_months INTEGER NOT NULL CHECK (age_in_months >= 0),
          original_price REAL NOT NULL CHECK (original_price > 0),
          suggested_price REAL,
          selling_price REAL NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
          min_acceptable_price REAL CHECK (min_acceptable_price IS NULL OR min_acceptable_price >= 0),
          willing_to_negotiate INTEGER NOT NULL DEFAULT 1,
          transaction_type TEXT NOT NULL DEFAULT 'SELL' CHECK (transaction_type IN ('SELL', 'SWAP', 'BORROW', 'RENT')),
          availability_status TEXT NOT NULL DEFAULT 'AVAILABLE',
          swap_for TEXT DEFAULT '',
          allow_multiple_swaps INTEGER NOT NULL DEFAULT 1,
          rental_price_per_day REAL CHECK (rental_price_per_day IS NULL OR rental_price_per_day >= 0),
          min_duration_days INTEGER CHECK (min_duration_days IS NULL OR min_duration_days >= 1),
          max_duration_days INTEGER CHECK (max_duration_days IS NULL OR max_duration_days >= 1),
          refundable_deposit REAL DEFAULT 0 CHECK (refundable_deposit IS NULL OR refundable_deposit >= 0),
          collection_location TEXT DEFAULT '',
          special_conditions TEXT DEFAULT '',
          description TEXT DEFAULT '',
          seller_name TEXT NOT NULL DEFAULT 'Campus Senior',
          contact_info TEXT NOT NULL DEFAULT 'senior@campus.example',
          image_url TEXT DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL
        );

        INSERT INTO listings_v2 (
          id, seller_id, item_name, category, condition_grade, age_in_months, original_price,
          suggested_price, selling_price, min_acceptable_price, willing_to_negotiate,
          transaction_type, availability_status, swap_for, allow_multiple_swaps,
          rental_price_per_day, min_duration_days, max_duration_days, refundable_deposit,
          collection_location, special_conditions, description, seller_name, contact_info,
          image_url, created_at
        )
        SELECT
          id, seller_id, item_name, category, condition_grade, age_in_months, original_price,
          suggested_price, selling_price, min_acceptable_price, COALESCE(willing_to_negotiate, 1),
          COALESCE(transaction_type, 'SELL'), COALESCE(availability_status, 'AVAILABLE'),
          COALESCE(swap_for, ''), COALESCE(allow_multiple_swaps, 1),
          rental_price_per_day, min_duration_days, max_duration_days, COALESCE(refundable_deposit, 0),
          COALESCE(collection_location, ''), COALESCE(special_conditions, ''),
          COALESCE(description, ''), COALESCE(seller_name, 'Campus Senior'),
          COALESCE(contact_info, 'senior@campus.example'), COALESCE(image_url, ''), created_at
        FROM listings;

        DROP TABLE listings;
        ALTER TABLE listings_v2 RENAME TO listings;
      `);
    });
    migrateTx();
    db.pragma('foreign_keys = ON');
    db.exec('CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_listings_condition ON listings(condition_grade)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(selling_price)');
  }

  db.exec('CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(transaction_type)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id)');
}

function initDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = getDatabasePath();
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schemaPath = path.join(__dirname, '../database/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  // Create base tables first (if listings pre-existed without new columns, handle ALTER before new indexes)
  try {
    db.exec(schemaSql);
  } catch (err) {
    if (!String(err.message).includes('no such column')) {
      throw err;
    }
    // Pre-existing Step 1 DB: run column migrations first, then re-run schema.sql for indexes
    ensureUnifiedListingColumns(db);
    db.exec(schemaSql);
  }

  ensureUnifiedListingColumns(db);

  dbInstance = db;
  return dbInstance;
}

function getDb() {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

module.exports = {
  initDatabase,
  getDb,
  closeDatabase
};

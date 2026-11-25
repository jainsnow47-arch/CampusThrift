-- ReLoop Campus Resale Marketplace - SQLite Schema

CREATE TABLE IF NOT EXISTS historical_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  condition_grade TEXT NOT NULL,
  age_in_months INTEGER NOT NULL CHECK (age_in_months >= 0),
  original_price REAL NOT NULL CHECK (original_price > 0),
  sold_price REAL NOT NULL CHECK (sold_price >= 0),
  resale_ratio REAL NOT NULL CHECK (resale_ratio >= 0 AND resale_ratio <= 1),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hist_category ON historical_transactions(category);
CREATE INDEX IF NOT EXISTS idx_hist_condition ON historical_transactions(condition_grade);
CREATE INDEX IF NOT EXISTS idx_hist_age ON historical_transactions(age_in_months);

CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  condition_grade TEXT NOT NULL,
  age_in_months INTEGER NOT NULL CHECK (age_in_months >= 0),
  original_price REAL NOT NULL CHECK (original_price > 0),
  suggested_price REAL,
  selling_price REAL NOT NULL CHECK (selling_price > 0),
  description TEXT DEFAULT '',
  seller_name TEXT NOT NULL DEFAULT 'Campus Senior',
  contact_info TEXT NOT NULL DEFAULT 'senior@campus.example',
  image_url TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_condition ON listings(condition_grade);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(selling_price);

CREATE TABLE IF NOT EXISTS wanted_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  max_budget REAL NOT NULL CHECK (max_budget > 0),
  description TEXT DEFAULT '',
  requested_by TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wanted_category ON wanted_requests(category);

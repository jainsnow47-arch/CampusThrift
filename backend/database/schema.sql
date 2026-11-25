-- Campus Thrift Circular Marketplace - SQLite Schema

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  handle TEXT NOT NULL UNIQUE,
  avatar_emoji TEXT NOT NULL DEFAULT '🐼',
  department TEXT NOT NULL DEFAULT 'Campus Student',
  is_demo INTEGER NOT NULL DEFAULT 1,
  is_verified INTEGER NOT NULL DEFAULT 0,
  campus_verified_roll TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

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

CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_condition ON listings(condition_grade);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(selling_price);
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(transaction_type);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);

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

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL,
  buyer_id INTEGER NOT NULL,
  seller_id INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('SELL', 'SWAP', 'BORROW', 'RENT')),
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'ACCEPTED', 'COMPLETED', 'CANCELLED')),
  proposed_price REAL CHECK (proposed_price IS NULL OR proposed_price >= 0),
  swap_offer TEXT DEFAULT '',
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  note TEXT DEFAULT '',
  buyer_confirmed INTEGER NOT NULL DEFAULT 0,
  seller_confirmed INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tx_listing ON transactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_tx_buyer ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_tx_seller ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions(status);

CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id INTEGER NOT NULL,
  rater_id INTEGER NOT NULL,
  ratee_id INTEGER NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  feedback TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(transaction_id, rater_id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (rater_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ratee_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ratings_ratee ON ratings(ratee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_tx ON ratings(transaction_id);

CREATE TABLE IF NOT EXISTS campus_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  event_name TEXT NOT NULL,
  event_date TEXT NOT NULL,
  description TEXT NOT NULL,
  banner_message TEXT NOT NULL,
  relevant_categories TEXT NOT NULL DEFAULT '[]',
  keywords TEXT NOT NULL DEFAULT '[]',
  image_url TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_date ON campus_events(event_date);


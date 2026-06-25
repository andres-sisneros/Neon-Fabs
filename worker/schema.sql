PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  home_city_id TEXT NOT NULL,
  current_city_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'drifter',
  credits INTEGER NOT NULL DEFAULT 0,
  chips INTEGER NOT NULL DEFAULT 1,
  reputation INTEGER NOT NULL DEFAULT 0,
  battery_seconds INTEGER NOT NULL DEFAULT 86400,
  battery_capacity_seconds INTEGER NOT NULL DEFAULT 86400,
  last_tick_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  inventory_limit INTEGER NOT NULL DEFAULT 96
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rarity TEXT NOT NULL,
  category TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS inventories (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  city_id TEXT NOT NULL REFERENCES cities(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  qty INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, city_id, item_id)
);

CREATE TABLE IF NOT EXISTS fabs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  city_id TEXT NOT NULL REFERENCES cities(id),
  rate_gph REAL NOT NULL DEFAULT 12,
  stored_grams REAL NOT NULL DEFAULT 0,
  print_pattern TEXT NOT NULL DEFAULT 'random',
  installed_at TEXT NOT NULL,
  last_tick_at TEXT NOT NULL,
  rented_until TEXT
);

CREATE TABLE IF NOT EXISTS fab_outputs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fab_id TEXT NOT NULL REFERENCES fabs(id) ON DELETE CASCADE,
  city_id TEXT NOT NULL REFERENCES cities(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  hidden INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  collected_at TEXT
);

CREATE TABLE IF NOT EXISTS patterns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  rarity TEXT NOT NULL,
  recipe_json TEXT NOT NULL,
  rep_reward INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_patterns (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pattern_id TEXT NOT NULL REFERENCES patterns(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, pattern_id)
);

CREATE TABLE IF NOT EXISTS market_listings (
  id TEXT PRIMARY KEY,
  city_id TEXT NOT NULL REFERENCES cities(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  seller_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL,
  price INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS market_bids (
  id TEXT PRIMARY KEY,
  city_id TEXT NOT NULL REFERENCES cities(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  buyer_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL,
  price INTEGER NOT NULL,
  reserved_credits INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS routes (
  from_city_id TEXT NOT NULL REFERENCES cities(id),
  to_city_id TEXT NOT NULL REFERENCES cities(id),
  distance_miles INTEGER NOT NULL,
  kind TEXT NOT NULL,
  base_hours REAL NOT NULL,
  PRIMARY KEY (from_city_id, to_city_id)
);

CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_city_id TEXT NOT NULL REFERENCES cities(id),
  to_city_id TEXT NOT NULL REFERENCES cities(id),
  vehicle_item_id TEXT NOT NULL REFERENCES items(id),
  cargo_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  depart_at TEXT NOT NULL,
  arrival_at TEXT NOT NULL,
  encounter_json TEXT,
  created_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS route_encounters (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  rarity TEXT NOT NULL,
  encounter_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS beta_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  city_id TEXT NOT NULL REFERENCES cities(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  qty INTEGER NOT NULL,
  price INTEGER NOT NULL,
  seller_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  buyer_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_fab_outputs_user_city_hidden ON fab_outputs(user_id, city_id, hidden);
CREATE INDEX IF NOT EXISTS idx_market_listings_city_item ON market_listings(city_id, item_id);
CREATE INDEX IF NOT EXISTS idx_market_bids_city_item ON market_bids(city_id, item_id);
CREATE INDEX IF NOT EXISTS idx_shipments_user_status_arrival ON shipments(user_id, status, arrival_at);

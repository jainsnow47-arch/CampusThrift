# AI Development Log: ReLoop Campus Circular Marketplace

## 1. Phase History & Prompts

### Step 1: Remove MySQL Dependency
> "Replace MySQL with SQLite (`better-sqlite3`), creating the same three tables automatically on first run, with the same 200-row seed and no duplicates on restart. Keep the API contract unchanged. Target: `npm install && npm start` works with no external database. Remove secrets: keep only `.env.example`."

### Phase 1: Foundation, Redesign and Unified Listing Types
> "Extend ReLoop incrementally without rewriting from scratch: preserve the existing 200-row historical dataset and weighted pricing engine, redesign the UI following the Neo-Brutalist reference screenshots, implement pseudonymous student identities (`users` + `sessions`), add unified `SELL`/`SWAP`/`BORROW`/`RENT` listings with private `min_acceptable_price`, and add deterministic Little Loops item mascots."

---

## 2. Architecture & Design Decisions

1. **CommonJS Backend Inside ESM Root**:
   - Kept root `package.json` compatible with Vite while configuring `backend/package.json` with `"type": "commonjs"` so Express routes, controllers, and `better-sqlite3` remain clean CommonJS modules.
2. **Zero-Config SQLite with Non-Destructive Schema Upgrade**:
   - `backend/config/db.js` runs `backend/database/schema.sql` and executes `ensureUnifiedListingColumns(db)` via `PRAGMA table_info(listings)` to safely add Phase 1 columns to pre-existing SQLite databases without losing Step 1 data.
3. **Server-Side Privacy & Ownership**:
   - `min_acceptable_price` is excluded from `SELECT_LISTING_COLUMNS` in `backend/controllers/listingController.js`, ensuring it never leaks in `GET /api/listings`, `GET /api/listings/search`, `GET /api/listings/:id`, or `POST /api/listings`.
   - `POST /api/listings` resolves `seller_id` from the authenticated Bearer token (`req.user`) rather than trusting frontend-supplied seller IDs.
4. **Deterministic Little Loops Service**:
   - `backend/services/mascotService.js` generates category- and transaction-type-aware first-person messages without calling any external LLM API.

---

## 3. Actual Issues Identified & Fixes

1. **Uploaded Reference Files Stored Under `public/assets/aistudio/`**:
   - *Issue*: `list_dir` on `/public/assets/aistudio` initially failed while shell inspection succeeded, and the original `README.md` and `PROMPT_LOG.md` were stored only as attachment copies rather than at workspace root.
   - *Fix*: Inspected the uploaded files directly and created maintained `/README.md` and `/PROMPT_LOG.md` at workspace root.
2. **Legacy SQLite Table Compatibility During Phase 1 Schema Extension**:
   - *Issue*: An existing `backend/database/reloop.sqlite` created during Step 1 had the original 3-table schema without `seller_id`, `transaction_type`, `min_acceptable_price`, or `SWAP`/`BORROW`/`RENT` columns, so `CREATE TABLE IF NOT EXISTS` alone would not add new columns.
   - *Fix*: Added `ensureUnifiedListingColumns(db)` in `backend/config/db.js` to inspect `PRAGMA table_info(listings)` and run `ALTER TABLE listings ADD COLUMN ...` only for missing columns, followed by seeding `users` and backfilling `seller_id` in `backend/database/seed.js`.
3. **Express Route Ordering & Sort/Filter Coordination**:
   - *Issue*: Putting `/:id` before `/search` in Express routes captures `/api/listings/search` as an invalid ID, and client-side sort dropdown (`price-asc` / `price-desc`) needed to account for `RENT` listings storing daily rates in `rentalPricePerDay`.
   - *Fix*: Kept `/api/listings/search` strictly ahead of `/api/listings/:id` in `backend/routes/listingRoutes.js`, used `COALESCE(l.rental_price_per_day, l.selling_price)` for SQL min/max price filtering, and normalized price extraction in `App.filterAndSortClientCache()`.
4. **Legacy SQLite `CHECK (selling_price > 0)` Constraint Blocking `SWAP` & `BORROW` Rows**:
   - *Issue*: During Phase 1 verification on an existing Step 1 `reloop.sqlite` database, `seedData` threw `SqliteError: CHECK constraint failed: selling_price > 0` because SQLite `ALTER TABLE` adds new columns without altering existing `CHECK` constraints on `selling_price`.
   - *Fix*: Updated `ensureUnifiedListingColumns` in `backend/config/db.js` to detect the legacy `CHECK (selling_price > 0)` clause in `sqlite_master`, perform a transactional table rebuild (`listings_v2` with `CHECK (selling_price >= 0)`), preserve all existing rows and IDs, and re-create indexes—then re-verified all Phase 1 tests end-to-end.

---

## 4. Phase 1 Verification Checklist

- [x] SQLite auto-creates tables and seeds 200 historical rows without duplication on restart.
- [x] `POST /api/pricing/suggest` benchmark (`Scientific Calculator`, `Calculators`, `Good`, `24`, `1200`) preserved and verified.
- [x] `GET /api/pricing/insights` and Chart.js visualizations preserved.
- [x] Pseudonymous demo auth (`/api/auth/personas`, `/api/auth/demo-login`, `/api/auth/me`, `/api/auth/profile`) working.
- [x] Unified `SELL`, `SWAP`, `BORROW`, `RENT` listing creation, search filtering, and 4-panel Listing Detail view working.
- [x] `minAcceptablePrice` verified absent from all public API responses.
- [x] Little Loops deterministic item mascots verified on cards and detail view.

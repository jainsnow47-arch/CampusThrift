# Campus Thrift – Your Campus, Your Needs, Your Way

> **"Don't buy new. Your campus already has it."**

Campus Thrift is a campus-specific circular marketplace engineered for college students. It connects students to buy, sell, swap, borrow, and rent campus essentials with pseudonymous student profiles, deterministic **Little Loops** item personalities, and an explainable, data-driven fair pricing engine backed by 200 historical campus transactions in SQLite.

---

## 1. System Architecture & Tech Stack

### Frontend
- **HTML5 & Modern CSS3**: Playful Neo-Brutalist design system with warm cream backgrounds (`#FBF3E4`), crisp ink borders (`#111111`), offset hard shadows, and vibrant semantic fills (`#FFC93C`, `#3CC4B3`, `#9B7BEA`, `#F25F5C`, `#BFE8C9`).
- **Vanilla JavaScript (ES6+)**: Modular API client (`frontend/js/api.js`) and UI controller (`frontend/js/app.js`).
- **Chart.js**: Dynamic interactive pricing analytics (`frontend/js/charts.js`).
- **Lucide Icons**: Crisp vector UI icons.

### Backend
- **Node.js & Express.js**: Modular MVC architecture (`controllers`, `routes`, `services`, `middleware`, `config`, `database`).
- **RESTful API**: Validated JSON endpoints using `express-validator` and centralized error handling.
- **SQLite (`better-sqlite3`)**: Zero-config embedded database (`backend/database/reloop.sqlite`) with parameterized SQL queries, automatic schema initialization, safe column migrations, and non-duplicating startup seeding.

### Database Tables
- `users`: Pseudonymous demo student personas (`handle`, `avatar_emoji`, `department`, `is_demo`, `is_verified`).
- `sessions`: Server-issued Bearer tokens linking authenticated browser sessions to `users`.
- `historical_transactions`: Exactly 200 synthetic historical campus transactions across 7 categories.
- `listings`: Unified listing table supporting `SELL`, `SWAP`, `BORROW`, and `RENT` with type-specific attributes and private `min_acceptable_price` (never returned by public APIs).
- `wanted_requests`: Student item request board.
- `transactions`: Lightweight peer exchange lifecycle (`REQUESTED`, `ACCEPTED`, dual-confirmed `COMPLETED`, `CANCELLED`).
- `ratings`: Post-completion 1–5 star ratings with optional feedback and `UNIQUE(transaction_id, rater_id)` constraint.
- `campus_events`: Configured campus calendar dataset (`event_name`, `event_date`, `description`, `banner_message`, `relevant_categories`, `keywords`, optional SVG `image_url`).

---

## 2. Phase 1 Features Implemented

1. **Zero-Config SQLite Storage & Safe Migrations**: Replaced external MySQL dependency with `better-sqlite3` (`npm install && npm start` runs standalone with no external DB or secrets). Existing Step 1 databases upgrade automatically via `ensureUnifiedListingColumns`.
2. **Unified 4-Mode Listings (`SELL`, `SWAP`, `BORROW`, `RENT`)**: Single unified `listings` table and API with strict server-side type validation:
   - **SELL**: AI-assisted fair price suggestion, public asking price, private `minAcceptablePrice` (stripped from all public queries/responses), and `willingToNegotiate`.
   - **SWAP**: Desired exchange items/categories (`swapFor`) and `allowMultipleSwaps`.
   - **BORROW**: Free lending (`₹0`), min/max borrowing days, collection location, optional refundable deposit, and special conditions.
   - **RENT**: Daily rate (`rentalPricePerDay`), min/max rental days, optional deposit, collection location, and rental conditions.
3. **Pseudonymous Campus Identity & Emoji Avatars**: 11 synthetic demo personas (`Panda_27 🐼`, `Mochi_14 🍡`, `Pixel_Fox 🦊`, `Koala_88 🐨`, `Sprout_09 🌱`, `Otter_42 🦦`, `Boba_19 🧋`, `Lynx_64 🐱`, `BinaryBard 🧭`, `SolderPro 🧩`, `PixelPanda 🦊`), random persona generation, customizable handle/emoji profile modal, and server-side ownership enforcement on listing deletion.
4. **Little Loops Item Personalities**: Deterministic, template-based first-person item buddy messages (`backend/services/mascotService.js`) tailored to category, age, condition, and transaction type—no external LLM API required.
5. **Preserved Explainable Fair Pricing Engine & Insights**:
   - Weighted similarity formula across condition proximity and exponential age decay using the 200 historical transactions.
   - Live Chart.js insights dashboard (`/api/pricing/insights`).
6. **Neo-Brutalist UI Redesign**:
   - Top segmented navigation, identity chip with `Demo` badge, scrolling ink ticker strip, category & mode filters, showcase listing cards with colored mode headers, condition pills, verified tags, 4 comic-cover transaction mode cards, Neo-Brutalist toggle switches, and a 4-panel Listing Detail view.
7. **Profile Badges, Campus Verification & Post-Completion Ratings**:
   - Real SQLite-derived trust badges (`Campus Verified`, `Completed Exchange`/`Campus Regular`, `Helpful Lender`, `Swap Partner`, `Top Rated Peer`) and peer inspector view.
   - Explicit campus student verification (`POST /api/auth/verify-campus` validating roll ID or `.edu`/`.ac.in` email without auto-verifying invalid inputs).
   - Mutual post-completion ratings (`1–5` stars + optional feedback) unlocked only after a transaction reaches `COMPLETED`, preventing self-ratings and duplicate ratings.
8. **Campus Event Calendar & Contextual Recommendations**:
   - Configured SQLite calendar (`Semester Examinations`, `Campus Placement Drive`, `Dandiya Night`, `Campus Hackathon`, `Annual College Festival`, `Senior Farewell`) surfacing matching `AVAILABLE` items with short explainable reasons and dismissible approaching-event banners.

---

## 3. Quick Start & Startup Instructions

### Prerequisites
- **Node.js** v18+

### Install & Run
From the project root:
```bash
npm install
npm start
```

On startup, Campus Thrift automatically:
1. Initializes `backend/database/reloop.sqlite` and applies schema + safe column migrations.
2. Seeds **200 historical transactions**, **11 synthetic demo users**, **10 showcase `SELL`/`SWAP`/`BORROW`/`RENT` listings**, and **4 initial wanted requests** without duplicating records on restart.
3. Starts the Express server and serves the frontend on **`http://localhost:3000`** (or `PORT` env variable).

---

## 4. REST API Endpoints

### Auth & Pseudonymous Profiles (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/personas` | List synthetic demo personas and allowed avatar emojis |
| `POST` | `/api/auth/demo-login` | Issue a session token for a demo persona (or generate a random persona) |
| `GET` | `/api/auth/me` | Return authenticated user profile (requires `Authorization: Bearer <token>`) |
| `PATCH` | `/api/auth/profile` | Update handle, avatar emoji, and department |
| `POST` | `/api/auth/logout` | Invalidate active session token |

### Pricing Engine (`/api/pricing`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/pricing/suggest` | Calculate fair resale price, min/max range, depreciation %, and explanation |
| `GET` | `/api/pricing/insights` | Return aggregated analytics across the 200 historical transactions |

### Unified Listings (`/api/listings`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/listings` | Retrieve all listings with `littleLoop` and public `sellerProfile` (never `minAcceptablePrice`) |
| `GET` | `/api/listings/search` | Filter by `category`, `condition`, `transactionType`, `minPrice`, `maxPrice`, `keyword` |
| `GET` | `/api/listings/:id` | Retrieve single listing detail |
| `POST` | `/api/listings` | Create `SELL`, `SWAP`, `BORROW`, or `RENT` listing using server-resolved identity |
| `DELETE` | `/api/listings/:id` | Delete listing (enforces ownership when authenticated) |

### Wanted Board (`/api/wanted`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/wanted` | List all active wanted requests |
| `POST` | `/api/wanted` | Create a new wanted request |

### Trust Profiles, Transactions & Ratings (`/api/auth`, `/api/transactions`, `/api/ratings`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/users/:id/profile` | Public peer profile with SQLite-computed trust metrics, earned badges, and ratings |
| `POST` | `/api/auth/verify-campus` | Verify current user with a valid campus roll ID or `.edu`/`.ac.in` email |
| `GET` | `/api/transactions` | List transactions involving the authenticated user |
| `POST` | `/api/transactions` | Submit a purchase, swap, borrow, or rental request on an available listing |
| `PATCH` | `/api/transactions/:id/status` | Accept, dual-confirm completion (`COMPLETED`), or cancel an exchange |
| `POST` | `/api/ratings` | Submit a `1–5` star rating for the peer on a `COMPLETED` transaction (one per rater per tx) |
| `GET` | `/api/ratings/user/:userId` | Retrieve ratings received by a student |

### Campus Event Calendar (`/api/events`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/events` | List all configured campus events with matching `AVAILABLE` listings and match reasons |
| `GET` | `/api/events/approaching` | List approaching configured events (`0–21` days out) for the dismissible marketplace banner |
| `GET` | `/api/events/:id` | Retrieve a single configured event and its recommended listings |

---

## 5. Verification Walkthrough (Gate Case)

1. Open `http://localhost:3000` and click **List Item**.
2. Click **⚡ Load Benchmark** (`Scientific Calculator fx-991ES`, `Calculators`, `Good`, `24` months, `₹1,200`).
3. Click **Get Fair Price** to confirm `POST /api/pricing/suggest` returns `~₹700` with fair range `₹620 – ₹780` and explanation citing 24 comparable historical transactions.
4. Enter an optional private minimum acceptable price, publish, and verify the listing appears in Marketplace and never exposes `minAcceptablePrice` in API responses.

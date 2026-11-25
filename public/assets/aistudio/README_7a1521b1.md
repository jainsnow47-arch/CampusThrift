# ReLoop – The Smart Campus Resale Marketplace

> **"Your old stuff. Someone else's new beginning."**

ReLoop is a complete, full-stack campus resale marketplace engineered for colleges. It bridges graduating seniors who want to pass down usable campus essentials with incoming juniors who need affordable gear, powered by an explainable, data-driven pricing engine that analyzes 200 historical campus transactions stored in MySQL.

---

## 1. System Architecture & Tech Stack

### Frontend
- **HTML5 & Modern CSS3**: Custom design system featuring Deep Forest Green (`#143d2b`), vibrant Lime accents (`#22c55e`), and warm off-white surfaces (`#f9faf8`).
- **Vanilla JavaScript (ES6+)**: Zero framework overhead, high responsiveness, and native Fetch API.
- **Chart.js**: Dynamic interactive data analytics for category retention, condition trends, and age depreciation.
- **Lucide Icons**: Crisp vector UI icons.

### Backend
- **Node.js & Express.js**: Modular MVC architecture (`controllers`, `routes`, `services`, `middleware`, `config`, `database`).
- **RESTful API**: Standardized JSON responses with input validation and centralized error handling.
- **mysql2/promise**: Parameterized queries to prevent SQL injection.

### Database
- **MySQL 8.0**:
  - `historical_transactions`: 200 realistic seeded campus transactions with indexed categories, conditions, and ages.
  - `listings`: Active peer-to-peer campus marketplace listings.
  - `wanted_requests`: Student item request board.

---

## 2. Data-Driven Pricing Engine

The core differentiator of ReLoop is its explainable pricing algorithm:

$$\text{Resale Ratio} = \frac{\text{Sold Price}}{\text{Original Price}}$$

Instead of applying a crude flat depreciation percentage, the engine:
1. Fetches historical transaction records from MySQL matching the item's category.
2. Evaluates condition proximity ($\Delta_{cond}$) and month-age distance ($\Delta_{age}$) for each record using exponential similarity decay:
   $$w_i = \max(0.20, 1 - 0.25 \cdot \Delta_{cond}) \times \exp\left(-\frac{\Delta_{age}}{16}\right)$$
3. Computes the weighted resale ratio $R_{weighted} = \frac{\sum w_i \cdot \text{ratio}_i}{\sum w_i}$ from comparable sales.
4. Blends the weighted ratio with category-level baselines according to sample confidence.
5. Applies hard safeguards: recommended price never exceeds original purchase price, never drops below ₹50, and rounds sensibly to the nearest ₹10.
6. Returns suggested price, fair campus range (min/max), depreciation %, comparable sales count, and a plain-English explanation.

---

## 3. Quick Start & Startup Instructions

### Prerequisites
- **Node.js** (v18 or higher)
- **MySQL Server 8.0** running locally on port 3306

### Step 1: Install Dependencies
From the project root:
```bash
npm run install:backend
```
*(or `cd backend && npm install`)*

### Step 2: Configure Environment Variables
Verify or update `backend/.env` with your local MySQL credentials:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=reloop_db
```

### Step 3: Run the Application
Start the backend server:
```bash
npm start
```
*(or `node backend/server.js`)*

On the first run, ReLoop automatically:
1. Creates the `reloop_db` database if not present.
2. Creates all tables (`historical_transactions`, `listings`, `wanted_requests`).
3. Seeds exactly **200 realistic historical transactions** without creating duplicates on subsequent restarts.
4. Seeds initial active listings and student wanted requests.
5. Starts the HTTP server and serves the frontend at `http://localhost:5000`.

Open your browser and navigate to:
**`http://localhost:5000`**

---

## 4. REST API Documentation

### Pricing Engine
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/pricing/suggest` | Calculate fair resale price with historical data explanation |
| `GET` | `/api/pricing/insights` | Return dynamic analytics (average resale %, category & condition breakdowns, age curves) |

#### Example: `POST /api/pricing/suggest`
**Request:**
```json
{
  "itemName": "Scientific Calculator",
  "category": "Calculators",
  "condition": "Good",
  "ageInMonths": 24,
  "originalPrice": 1200
}
```
**Response:**
```json
{
  "success": true,
  "suggestedPrice": 710,
  "minimumPrice": 620,
  "maximumPrice": 800,
  "depreciationPercentage": 40.8,
  "retentionPercentage": 59.2,
  "comparableTransactions": 19,
  "categoryBaselineRetention": 58.8,
  "explanation": "Based on 19 comparable historical calculators transactions with similar condition (Good) and age (~24 months), similar items retain approximately 59.2% of their original value (40.8% depreciation). Suggested resale price: ₹710."
}
```

### Listings
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/listings` | Retrieve all active listings |
| `GET` | `/api/listings/search` | Search with optional query params (`category`, `condition`, `minPrice`, `maxPrice`, `keyword`) |
| `GET` | `/api/listings/:id` | Retrieve an individual listing by ID |
| `POST` | `/api/listings` | Create and publish a new listing |
| `DELETE` | `/api/listings/:id` | Remove a listing |

### Wanted Board
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/wanted` | Retrieve all active student wanted requests |
| `POST` | `/api/wanted` | Post a new wanted request to the board |

---

## 5. Judge Demonstration Scenario Walkthrough

The platform includes a 1-click shortcut for the judge scenario on the **"Sell an Item"** page:

1. Click **"Sell an Item"** in the top navigation.
2. Click the green **"⚡ Load Benchmark"** button to automatically prefill:
   - **Item**: Scientific Calculator fx-991ES
   - **Category**: Calculators
   - **Condition**: Good
   - **Age**: 24 months
   - **Original Price**: ₹1,200
3. Click **"Get Fair Price"**:
   - The Express backend queries historical calculator records from MySQL.
   - Calculates a fair suggested price (~₹710), range (₹620 - ₹800), and displays 19 comparable transactions with clear rationale.
4. Click **"Publish Listing"**:
   - The listing is immediately committed to MySQL.
   - The UI automatically redirects to the **Marketplace**, displaying the newly published calculator card at the top.
5. In the Marketplace search bar, type `Calculator` to filter and verify immediate indexing.

---

## 6. Directory Structure

```
finalzip/
├── backend/
│   ├── config/
│   │   └── db.js                 # Database connection pool & auto-init
│   ├── controllers/
│   │   ├── listingController.js   # Listing CRUD & parameterized search
│   │   ├── pricingController.js   # Valuation & analytics controller
│   │   └── wantedController.js    # Wanted requests controller
│   ├── database/
│   │   ├── schema.sql            # Table definitions & indexes
│   │   └── seed.js               # Exactly 200 realistic transactions seeder
│   ├── middleware/
│   │   └── errorHandler.js       # Centralized error handler
│   ├── routes/
│   │   ├── listingRoutes.js      # Listings routing
│   │   ├── pricingRoutes.js      # Pricing routing
│   │   └── wantedRoutes.js       # Wanted routing
│   ├── services/
│   │   └── pricingService.js     # Data-driven weighted pricing algorithm
│   ├── .env                      # Local environment configuration
│   ├── .env.example              # Template environment configuration
│   ├── package.json              # Backend dependencies
│   └── server.js                 # Express server & static asset host
├── frontend/
│   ├── css/
│   │   └── styles.css            # Custom design system
│   ├── js/
│   │   ├── api.js                # Fetch API client
│   │   ├── app.js                # UI controller, routing & modals
│   │   └── charts.js             # Chart.js analytics graphs
│   └── index.html                # Single-page application markup
├── PROMPT_LOG.md                 # AI prompts & engineering log
├── README.md                     # Comprehensive documentation
└── package.json                  # Root npm scripts
```

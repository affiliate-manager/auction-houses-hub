# Phase 2: Deal Pipeline Intelligence Dashboard
## Technical Specification

> **Status:** Planning
> **Dependencies:** Phase 1 (Auction Houses Hub - Complete)
> **Estimated Timeline:** 4 sub-phases (2A-2D)

---

## 1. Overview & Core Concept

The Deal Pipeline Intelligence Dashboard (Data Form Type 2) represents the evolution from auction house-level metadata (Scorecard) to **individual lot-level deal intelligence**. While the Scorecard helps investors identify *which* auction houses to watch, the Deal Pipeline surfaces *specific investment opportunities* with integrated bridging loan offers at the precise moment of maximum purchase intent.

### Key Value Propositions

| Proposition | Description |
|---|---|
| **Micro-moment targeting** | Loan offers appear when investors evaluate specific properties |
| **Data completeness** | 40+ data points per lot (vs 20 per auction house in Scorecard) |
| **Intent amplification** | "Save search" alerts create recurring touchpoints for loan remarketing |
| **Competitive moat** | Most bridging lenders compete on rate; this competes on timing and convenience |

---

## 2. Technical Architecture

### 2.1 System Architecture

```
CLIENT LAYER
├── Web App (Next.js)
├── Mobile App (PWA/React)
└── Email/SMS Alerts (SendGrid/Twilio)
        │
        ▼
   API GATEWAY (Next.js API)
        │
   ┌────┼────┐
   ▼    ▼    ▼
DEAL    USER   LOAN
ENGINE  SERVICE ENGINE
(Lots)  (Prefs) (Calc)
   │    │    │
   └────┼────┘
        ▼
   DATA PIPELINE (Ingestion/ETL)
        │
   ┌────┼────┐
   ▼    ▼    ▼
AUCTION  WEB    MANUAL
APIs    SCRAPERS UPLOAD
(Feeds) (Puppeteer) (Admin)
```

### 2.2 Database Schema (PostgreSQL)

```sql
-- Core Lot Table
CREATE TABLE lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) NOT NULL,
    auction_house_id UUID REFERENCES auction_houses(id),
    
    -- Property Details
    title VARCHAR(500),
    description TEXT,
    property_type VARCHAR(50),        -- residential, commercial, land, mixed
    tenure VARCHAR(50),               -- freehold, leasehold
    leasehold_years INTEGER,
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    postcode VARCHAR(20),
    county VARCHAR(100),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    bedrooms INTEGER,
    bathrooms INTEGER,
    sq_footage DECIMAL(10,2),
    plot_size DECIMAL(10,2),
    
    -- Pricing
    guide_price_min DECIMAL(12,2),
    guide_price_max DECIMAL(12,2),
    reserve_price DECIMAL(12,2),
    sold_price DECIMAL(12,2),
    
    -- Auction Details
    auction_type VARCHAR(50),
    auction_date TIMESTAMP,
    bidding_deadline TIMESTAMP,
    buyers_premium_percent DECIMAL(4,2),
    deposit_percent DECIMAL(4,2),
    completion_days INTEGER,
    viewing_dates JSONB,
    
    -- Condition & Investment Profile
    condition VARCHAR(50),
    planning_status VARCHAR(100),
    current_tenancy VARCHAR(50),
    rental_income_annual DECIMAL(10,2),
    yield_percentage DECIMAL(5,2),
    
    -- Legal & Documentation
    legal_pack_url VARCHAR(500),
    epd_rating VARCHAR(10),
    searches_included BOOLEAN,
    
    -- Data Quality
    data_freshness TIMESTAMP,
    confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
    
    -- Status
    status VARCHAR(50),               -- upcoming, live, sold, withdrawn, unsold
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(external_id, auction_house_id)
);

-- Lot Images/Media
CREATE TABLE lot_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID REFERENCES lots(id) ON DELETE CASCADE,
    media_type VARCHAR(50),
    url VARCHAR(500),
    is_primary BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- User Saved Searches
CREATE TABLE saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255),
    filters JSONB NOT NULL DEFAULT '{}',
    alert_enabled BOOLEAN DEFAULT TRUE,
    alert_frequency VARCHAR(50),      -- instant, daily_digest, weekly_digest
    alert_channels JSONB DEFAULT '["email"]',
    pre_approved_loan BOOLEAN DEFAULT FALSE,
    max_loan_amount DECIMAL(12,2),
    preferred_ltv INTEGER,
    last_alert_sent TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Alert History & Tracking
CREATE TABLE alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saved_search_id UUID REFERENCES saved_searches(id),
    lot_id UUID REFERENCES lots(id),
    alert_type VARCHAR(50),
    sent_at TIMESTAMP DEFAULT NOW(),
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    loan_requested BOOLEAN DEFAULT FALSE
);

-- User Lot Interactions (for intent scoring)
CREATE TABLE lot_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    lot_id UUID REFERENCES lots(id),
    interaction_type VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Loan Offers Generated
CREATE TABLE loan_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    lot_id UUID REFERENCES lots(id),
    loan_amount DECIMAL(12,2),
    ltv_percent DECIMAL(5,2),
    interest_rate_monthly DECIMAL(5,3),
    term_months INTEGER,
    arrangement_fee DECIMAL(10,2),
    exit_fee DECIMAL(10,2),
    status VARCHAR(50),
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_lots_auction_date ON lots(auction_date);
CREATE INDEX idx_lots_status ON lots(status);
CREATE INDEX idx_lots_postcode ON lots(postcode);
CREATE INDEX idx_lots_geo ON lots USING GIST (point(longitude, latitude));
CREATE INDEX idx_lots_price ON lots(guide_price_min, guide_price_max);
CREATE INDEX idx_lots_freshness ON lots(data_freshness);
CREATE INDEX idx_lots_gin ON lots USING GIN (
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
);
```

---

## 3. Data Pipeline Architecture

### 3.1 Data Sources & Collection Strategy

| Source Type | Auction Houses | Method | Frequency | Data Quality | Maintenance Level |
|---|---|---|---|---|---|
| **Direct API** | ~15 major houses (Allsop, SDL, Savills, BidX1) | REST API / GraphQL | Real-time webhooks + 4x daily sync | High | Low |
| **XML/RSS Feeds** | ~25 mid-tier houses | XML parsing | Every 2 hours | Medium | Medium |
| **Web Scraping** | ~60 smaller houses | Puppeteer/Playwright | Every 6 hours | Variable | High |
| **Manual Upload** | New partnerships | Admin CSV upload | On-demand | High | Low |

### 3.2 Ingestion Orchestrator

```typescript
// File: lib/pipeline/LotIngestionOrchestrator.ts

class LotIngestionOrchestrator {
  private bullQueue: Queue; // Redis-backed job queue
  
  async processIngestionJob(job: Job): Promise<void> {
    const source = await this.getSourceById(job.data.sourceId);
    
    // 1. Fetch raw data
    const rawData = await this.fetchFromSource(source);
    
    // 2. Normalize to standard schema
    const normalizedLots = await this.normalizeData(source, rawData);
    
    // 3. Enrich with additional data
    const enrichedLots = await this.enrichLots(normalizedLots);
    
    // 4. Upsert to database
    await this.upsertLots(enrichedLots);
    
    // 5. Trigger alert evaluation
    await this.evaluateAlertsForNewLots(enrichedLots);
    
    // 6. Update source health metrics
    await this.updateSourceHealth(sourceId, 'healthy');
  }
}
```

### 3.3 Web Scraper Architecture

```typescript
// File: lib/scrapers/BaseAuctionScraper.ts

abstract class BaseAuctionScraper {
  abstract auctionHouseId: string;
  abstract baseUrl: string;
  abstract selectors: {
    lotList: string;
    lotTitle: string;
    lotPrice: string;
    lotAddress: string;
    lotDescription: string;
    nextPage: string;
    detailPageLink: string;
  };
  
  async scrapeLots(): Promise<RawLot[]> {
    await this.initialize();
    const lotUrls = await this.extractLotUrls();
    
    for (const url of lotUrls) {
      const lot = await this.scrapeLotDetail(url);
      if (lot) lots.push(lot);
      await this.randomDelay(2000, 5000); // Rate limiting
    }
    
    return lots;
  }
  
  protected abstract parseLotData(raw: any, sourceUrl: string): RawLot | null;
}
```

### 3.4 Data Normalization

Key normalizer responsibilities:
- **Price parsing** - Handle various formats ("Guide: £100,000+", "From £80k")
- **Postcode validation** - UK postcode regex + geocoding
- **Property type classification** - NLP on descriptions
- **Condition detection** - Keywords: "refurb", "renovation", "derelict", "plot"
- **Tenancy parsing** - "Vacant", "Let at £X pa", "AST", "Regulated"

---

## 4. Core Features

### 4.1 Deal Card Component
- Image carousel with primary image
- Property type + tenancy badges
- Guide price + estimated sale price (based on auction house avg premium)
- Key metrics: beds, auction countdown, yield
- Investment profile tags (condition, planning, income)
- **Integrated loan calculator** on each card
- Auction terms summary (buyer's premium, deposit, completion)
- Save/bookmark functionality

### 4.2 Advanced Search & Filters
- **Geographic search** with map and radius selector
- **Price range** slider (£0 - £2m+)
- **Yield filter** (minimum yield threshold)
- **Property type** multi-select
- **Condition** multi-select (Modern / Refurb / Derelict / Development)
- **Tenancy** segmented control (Vacant / Tenanted / Any)
- **Auction house** multi-select
- **Auction date range** picker
- **Keyword search** (full-text)
- Save Search & Get Alerts button

---

## 5. Loan Integration System

### 5.1 Intent Scoring Engine

| Signal | Max Points | Description |
|---|---|---|
| Lot views | 25 | Repeated views = higher intent |
| Time on page | 20 | 10+ minutes = 20 pts |
| Loan calculator opens | 25 | Each open = 8 pts |
| Saved lot | 10 | Bookmarked the property |
| Saved search match | 10 | Property matches alerts |
| Financial qualification | 10 | Pre-approved amount covers lot |
| Historical wins | 10 | Previous auction purchases |

**Thresholds:**
- Score >= 60: Generate personalized loan offer
- Score >= 40: Show soft loan CTA
- Score < 40: Standard page with subtle finance mention

### 5.2 Dynamic Loan Calculator
- Pre-filled with lot's estimated sale price (guide + avg auction house premium)
- LTV slider (50-75%)
- Term selector (3-24 months)
- Real-time calculation: loan amount, monthly interest, arrangement fee, total cost
- **Auction timeline warning** ("This lot completes in 28 days - our fast-track can do 14 days")
- One-click "Get Pre-Approved Loan Offer" CTA

---

## 6. Premium Features: Saved Searches & Alerts

### 6.1 Alert Flow

```
New Lot Ingested
  → Match against all active saved searches
  → Calculate match score (location, price, yield, type, condition)
  → If score >= 70%: Queue alert
  → Check user preferences (instant / daily digest / weekly)
  → Generate personalized content
  → If user has pre-approved loan: Include loan offer in alert
  → Send via preferred channels (email / SMS / push)
  → Track opens, clicks, loan applications
```

### 6.2 Alert Channels
- **Email** - Rich HTML template with lot cards, images, loan offers
- **SMS** - Concise alert with lot address, price, link
- **Push** - In-app notification with lot title and guide price

### 6.3 Remarketing Loop
```
Save Search → Alert sent → User views lot → Intent score rises 
→ Personalized loan offer → Application → Conversion
```

---

## 7. Data Freshness Requirements

| Data Type | Freshness Req. | Update Strategy | Fallback |
|---|---|---|---|
| **Lot Listings** | < 2 hours | Webhooks (API), Scraping (2-6hrs) | Manual refresh button |
| **Lot Prices** | < 1 hour | Real-time during auction, Daily otherwise | Email alerts on price changes |
| **Auction Results** | < 6 hours | Post-auction scraper runs | Manual result submission |
| **Auction House Metadata** | < 24 hours | Daily sync | Cached for 7 days |
| **Loan Rates** | Real-time | API connection to lender | Cached rates with timestamp warning |

---

## 7.3 Cost-Benefit Analysis

| Component | Monthly Cost (Est.) | Value Generated | ROI |
|---|---|---|---|
| **API Integrations** (15 sources) | £800-1,200 | High data quality, real-time updates | 4:1 |
| **Scraping Infrastructure** | £400-600 | Access to 60 additional auction houses | 3:1 |
| **Server/Database** (Vercel + Supabase) | £150-250 | Core platform hosting | 5:1 |
| **Alert Delivery** (SendGrid/Twilio) | £200-400 | Direct user engagement | 8:1 |
| **Maintenance/Dev** | £2,000-3,000 | System health, updates, new integrations | 6:1 |
| **Total** | **£3,550-5,450** | | **~5:1** |

---

## 8. Implementation Roadmap

### Phase 2A (Foundation)
- [ ] Database schema setup (lots, saved_searches, alerts)
- [ ] Integrate 5 major auction house APIs (Allsop, SDL, Auction House UK, Savills, BidX1)
- [ ] Basic lot search/filter UI
- [ ] Simple loan calculator on deal cards
- [ ] Email alerts for saved searches

### Phase 2B (Expansion)
- [ ] Add 10 more API integrations
- [ ] Implement web scraping for 20 mid-tier auction houses
- [ ] Advanced filters (geographic radius, yield calculation)
- [ ] SMS/push notification channels
- [ ] Intent scoring engine v1

### Phase 2C (Intelligence)
- [ ] Add remaining 75 auction houses via scraping/manual
- [ ] Machine learning for price estimation
- [ ] Pre-approved loan offer automation
- [ ] Alert personalization engine
- [ ] CRM integration for broker handoff

### Phase 2D (Scale & Optimize)
- [ ] Scraper health monitoring
- [ ] Data quality dashboards
- [ ] A/B testing for loan CTAs
- [ ] Mobile app (PWA)
- [ ] Performance optimization (caching, CDN)

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend API | Next.js API Routes |
| Database | PostgreSQL (Supabase) |
| Job Queue | Redis + BullMQ |
| Scraping | Puppeteer / Playwright |
| Email | SendGrid |
| SMS | Twilio |
| Hosting | Vercel |
| Monitoring | Sentry + custom health dashboards |
| Auth | Supabase Auth / NextAuth |

---

*Document created: February 2026*
*Based on Phase 1: UK Auction Houses Hub (100 auction houses, static site)*

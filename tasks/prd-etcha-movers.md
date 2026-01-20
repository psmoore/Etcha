# PRD: Etcha Movers

## Introduction

**Etcha Movers** is a web application that aggregates prediction markets from Kalshi, Polymarket, and Manifold Markets, identifies the 20 markets with the largest price movements over user-selected time periods (1 day, 1 week, 1 month), and provides AI-generated explanations for each price change. The app excludes sports and simple price-threshold markets to focus on politics, technology, regulation, and topics influencing large companies' futures.

The application lives in the `etcha-movers/` folder within the Etcha repository and uses Etcha's Etch-A-Sketch visual design language with the same logos, color scheme, and styling as the main Etcha homepage.

## Goals

- Aggregate prediction market data from Kalshi, Polymarket, and Manifold Markets into a unified database
- Display the top 20 markets by absolute price change for a user-selected time period
- Filter out sports and price-threshold markets automatically
- Provide AI-generated explanations for each significant price movement
- Schedule daily data updates at 4am Pacific, plus manual refresh capability
- Require user authentication to access the app
- Match Etcha's Etch-A-Sketch visual styling

## User Stories

### US-001: User Authentication Setup
**Description:** As a user, I want to log in to access the prediction markets tracker so that my data is secure.

**Acceptance Criteria:**
- [ ] NextAuth.js configured with Google OAuth provider
- [ ] Login page styled with Etcha Etch-A-Sketch theme
- [ ] Unauthenticated users redirected to login page
- [ ] Session persists across page refreshes
- [ ] Logout functionality available
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-002: MongoDB Database Schema Setup
**Description:** As a developer, I need a database schema to store market data so that historical prices can be tracked and compared.

**Acceptance Criteria:**
- [ ] MongoDB connection configured via environment variables
- [ ] Market collection with fields: marketId, source, marketName, eventName (nullable), marketUrl, eventUrl (nullable), description, creationDate, resolutionDate, currentPrice, price1DayAgo (nullable), price1WeekAgo (nullable), price1MonthAgo (nullable), priceChange1Day (nullable), priceChange1Week (nullable), priceChange1Month (nullable), category, isExcluded (boolean, default false), excludedBy (nullable), excludedAt (nullable), lastUpdated
- [ ] HistoricalPrice collection with fields: marketId, source, price, timestamp
- [ ] Indexes created for efficient querying (marketId, source, timestamp, priceChange fields)
- [ ] Typecheck/lint passes

### US-003: Kalshi API Integration
**Description:** As a system, I need to fetch market data from Kalshi so that users can see Kalshi prediction markets.

**Acceptance Criteria:**
- [ ] Kalshi API client implemented with proper authentication
- [ ] Fetch all active markets with their current prices
- [ ] Extract market name, event name (if applicable), URLs, description, creation date, resolution date
- [ ] Filter out markets with category containing "sports" or markets that are simple price thresholds (e.g., "BTC above $X")
- [ ] Store historical prices with timestamps
- [ ] Handle API rate limits and errors gracefully
- [ ] Typecheck/lint passes

### US-004: Polymarket API Integration
**Description:** As a system, I need to fetch market data from Polymarket so that users can see Polymarket prediction markets.

**Acceptance Criteria:**
- [ ] Polymarket API client implemented (using their public CLOB API)
- [ ] Fetch all active markets with their current prices
- [ ] Extract market name, event name (if applicable), URLs, description, creation date, resolution date
- [ ] Filter out sports markets and simple price threshold markets
- [ ] Store historical prices with timestamps
- [ ] Handle API rate limits and errors gracefully
- [ ] Typecheck/lint passes

### US-005: Manifold Markets API Integration
**Description:** As a system, I need to fetch market data from Manifold Markets so that users can see Manifold prediction markets.

**Acceptance Criteria:**
- [ ] Manifold Markets API client implemented (using their public API)
- [ ] Fetch all active markets with their current prices
- [ ] Extract market name, group/event name (if applicable), URLs, description, creation date, resolution date
- [ ] Filter out sports markets and simple price threshold markets
- [ ] Store historical prices with timestamps
- [ ] Handle API rate limits and errors gracefully
- [ ] Typecheck/lint passes

### US-006: Price Change Calculation Logic
**Description:** As a system, I need to calculate price changes so that markets can be ranked by movement magnitude.

**Acceptance Criteria:**
- [ ] Calculate priceChange1Day = currentPrice - price1DayAgo (only if market existed 1 day ago)
- [ ] Calculate priceChange1Week = currentPrice - price1WeekAgo (only if market existed 1 week ago)
- [ ] Calculate priceChange1Month = currentPrice - price1MonthAgo (only if market existed 1 month ago)
- [ ] Price changes stored as percentage points (e.g., +32, -59)
- [ ] Markets without sufficient history show null for unavailable time periods
- [ ] Typecheck/lint passes

### US-007: Scheduled Data Refresh (4am Pacific Daily)
**Description:** As a system, I need to automatically update market data daily so that prices stay current.

**Acceptance Criteria:**
- [ ] Netlify Scheduled Function configured to run at 4am Pacific (12:00 UTC) using `@netlify/functions` with schedule decorator
- [ ] Cron job fetches data from all three sources
- [ ] Historical prices recorded before updating current prices
- [ ] Price changes recalculated after update
- [ ] Error logging for failed API calls
- [ ] Typecheck/lint passes

### US-008: Manual "Update Data" Button
**Description:** As a user, I want to manually trigger a data refresh so that I can see the latest prices on demand.

**Acceptance Criteria:**
- [ ] "Update Data" button visible on the main page header
- [ ] Button styled with Etcha gold accent color
- [ ] Loading state shown while update is in progress
- [ ] Success/error toast notification after completion
- [ ] Button disabled during update to prevent duplicate requests
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-009: Time Period Filter UI
**Description:** As a user, I want to filter markets by time period (1 day, 1 week, 1 month) so that I can see price movements relevant to my analysis.

**Acceptance Criteria:**
- [ ] Filter buttons/tabs for "1 Day", "1 Week", "1 Month" at top of page
- [ ] Active filter visually highlighted
- [ ] Filter selection persists in URL query parameter
- [ ] Changing filter immediately updates the displayed markets
- [ ] Default filter is "1 Day"
- [ ] Styled with Etcha Etch-A-Sketch theme
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-010: Market List Display (Top 20 by Absolute Change)
**Description:** As a user, I want to see the top 20 markets by price movement so that I can identify the most significant changes.

**Acceptance Criteria:**
- [ ] Display only markets that existed at the prior time (based on filter selection)
- [ ] Sort by absolute value of price change (descending)
- [ ] Limit to top 20 markets
- [ ] Each row shows: Market Name, Source (Kalshi/Polymarket/Manifold), Current Price, Prior Price, Price Change
- [ ] Price change displayed with + or - sign and colored (green positive, red negative)
- [ ] Styled as Etcha "screen" cards with grey background
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-011: Market Detail Expansion
**Description:** As a user, I want to expand a market row to see more details so that I can understand the full context.

**Acceptance Criteria:**
- [ ] Click/tap on market row expands to show additional details
- [ ] Expanded view shows: Description, Event Name (if any), Creation Date, Resolution Date, Links to Market/Event pages
- [ ] Links open in new tab
- [ ] Smooth expand/collapse animation
- [ ] Only one market expanded at a time
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-012: AI Explanation Integration (Gemini)
**Description:** As a user, I want to see AI-generated explanations for price movements so that I understand what likely caused each change.

**Acceptance Criteria:**
- [ ] `@google/genai` SDK installed and configured with `gemini-3-flash-preview` model
- [ ] When page loads or filter changes, generate explanations for all 20 displayed markets in parallel using `Promise.all()`
- [ ] Each prompt includes: market name, description, price change amount, time period (1D/1W/1M)
- [ ] Prompt instructs Gemini to search the internet and explain the most likely cause of the price change
- [ ] Explanations generated on-demand (not stored in database)
- [ ] All 20 explanations returned within ~3-5 seconds due to parallel execution
- [ ] AI explanation displayed in expanded market detail view
- [ ] Loading state shown while explanations are being generated
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-013: Category Filtering Logic
**Description:** As a system, I need to automatically exclude sports and price-threshold markets so that users see only relevant prediction markets.

**Acceptance Criteria:**
- [ ] Exclude markets where title/description contains sports-related keywords (NBA, NFL, MLB, NHL, FIFA, soccer, football, basketball, baseball, hockey, tennis, golf, boxing, UFC, MMA, cricket, rugby, Olympics)
- [ ] Exclude markets that are simple price thresholds (pattern: "[Asset] above/below $X", "Will [Asset] reach $X")
- [ ] Include markets about: politics, elections, regulation, technology, AI, companies, economics, policy, legislation
- [ ] Filtering applied during data ingestion
- [ ] Typecheck/lint passes

### US-014: Main Page Layout with Etcha Styling
**Description:** As a user, I want the app to have the same Etch-A-Sketch styling as Etcha homepage so that it feels like part of the Etcha product family.

**Acceptance Criteria:**
- [ ] Red background (--etcha-red: #CC0000)
- [ ] Grey "screen" sections with inset shadow
- [ ] Caveat font for headlines, JetBrains Mono for body text
- [ ] Gold accent color (--etcha-gold: #C5A356) for CTAs and highlights
- [ ] Etcha logo in navigation
- [ ] Dial decorations at page bottom
- [ ] Responsive design matching Etcha breakpoints
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-015: Navigation Header
**Description:** As a user, I want a navigation header so that I can access key actions and see branding.

**Acceptance Criteria:**
- [ ] Etcha.company logo (Caveat font, gold color)
- [ ] "Update Data" button
- [ ] User avatar/dropdown with logout option
- [ ] Styled consistently with Etcha nav-bar
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-016: Empty State Handling
**Description:** As a user, I want to see a helpful message when no markets match my filter so that I understand why the list is empty.

**Acceptance Criteria:**
- [ ] Display message: "No markets found for this time period"
- [ ] Suggest trying a different time period filter
- [ ] Styled with Etcha theme
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-017: Loading States
**Description:** As a user, I want to see loading indicators so that I know data is being fetched.

**Acceptance Criteria:**
- [ ] Skeleton loaders for market list during initial load
- [ ] Spinner on "Update Data" button while refreshing
- [ ] Loading state for expanded market details
- [ ] Styled with Etcha color palette
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-018: Error Handling UI
**Description:** As a user, I want to see clear error messages so that I know when something goes wrong.

**Acceptance Criteria:**
- [ ] Toast notifications for API errors
- [ ] Retry button when data fetch fails
- [ ] Graceful degradation if one source fails (show data from other sources)
- [ ] Error styling with red accent
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-019: Admin Market Exclusion
**Description:** As an admin, I want to manually exclude specific markets so that irrelevant or problematic markets don't appear in results.

**Acceptance Criteria:**
- [ ] Admin-only page accessible via protected route
- [ ] List view of all markets with search/filter functionality
- [ ] Toggle to exclude/include individual markets
- [ ] Excluded markets stored with `isExcluded: true` flag in database
- [ ] Excluded markets never appear in top-20 results
- [ ] Bulk exclude option for multiple markets
- [ ] Audit log showing who excluded what and when
- [ ] Styled with Etcha Etch-A-Sketch theme
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: The system must authenticate users via NextAuth.js with OAuth provider before granting access
- FR-2: The system must store market data in MongoDB with all specified fields
- FR-3: The system must fetch data from Kalshi API including market name, event, URLs, description, dates, and prices
- FR-4: The system must fetch data from Polymarket CLOB API including market name, event, URLs, description, dates, and prices
- FR-5: The system must fetch data from Manifold Markets API including market name, group, URLs, description, dates, and prices
- FR-6: The system must filter out sports markets based on keyword matching in title/description
- FR-7: The system must filter out simple price-threshold markets (e.g., "BTC above $100k")
- FR-8: The system must calculate price change as: current_price - prior_period_price (in percentage points)
- FR-9: The system must only display markets that existed at the selected prior time period
- FR-10: The system must sort markets by absolute value of price change in descending order
- FR-11: The system must limit the display to top 20 markets by price movement
- FR-12: The system must run automated data refresh daily at 4am Pacific via Netlify cron
- FR-13: The system must allow manual data refresh via "Update Data" button
- FR-14: The system must generate AI explanations on-demand using `gemini-3-flash-preview` via `@google/genai` SDK for the 20 displayed markets in parallel when the page loads or filter changes
- FR-15: The system must store historical prices for calculating past price comparisons
- FR-16: The system must persist filter selection in URL query parameters
- FR-17: The system must open external market/event links in new browser tabs
- FR-18: The system must allow admins to manually exclude markets via an admin interface
- FR-19: The system must exclude admin-excluded markets from top-20 results

## Non-Goals (Out of Scope)

- User-created watchlists or saved markets
- Price alerts or notifications
- Trading functionality or portfolio tracking
- Historical price charts or graphs
- Comparison between different prediction market sources for the same event
- User-submitted market suggestions
- Mobile native apps (web responsive only)
- Additional prediction market sources beyond Kalshi, Polymarket, Manifold Markets (future enhancement)
- Custom AI explanation prompts or user feedback on explanations
- Market resolution tracking or outcome history
- Social features (sharing, comments)

## Design Considerations

### Visual Design
- Follow Etcha Etch-A-Sketch design system exactly:
  - Primary red: #CC0000
  - Screen grey: #E8E4E0
  - Gold accent: #C5A356
  - Charcoal text: #2A2A2A
  - Headlines: Caveat font (cursive)
  - Body: JetBrains Mono (monospace)
- "Screen" sections with rounded corners, inset shadows
- Dial decorations at page bottom
- Fade-in animations on scroll

### UI Components to Build
- FilterTabs: Time period selection (1D / 1W / 1M)
- MarketCard: Expandable row showing market summary and details
- UpdateButton: Manual refresh trigger with loading state
- SourceBadge: Visual indicator for Kalshi/Polymarket/Manifold
- PriceChange: Colored +/- percentage display
- AIExplanation: Formatted text block in expanded view

### Reusable Etcha Patterns
- `.screen` class for grey content areas
- `.section-label` for category labels
- `.cta-button` styling for primary actions
- `.nav-bar` layout for header
- `.dial` decorations

## Technical Considerations

### Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Authentication:** NextAuth.js with Google OAuth
- **Database:** MongoDB (via Mongoose or native driver)
- **Styling:** CSS Modules or Tailwind (matching Etcha CSS variables)
- **AI:** Google Gemini (`gemini-3-flash-preview` model via `@google/genai` SDK)
- **Scheduling:** Netlify Scheduled Functions
- **Deployment:** Netlify

### API Integrations
- **Kalshi:** REST API with API key authentication
- **Polymarket:** CLOB API (public endpoints)
- **Manifold Markets:** Public REST API (no auth required for read)
- **Gemini:** `@google/genai` SDK with `gemini-3-flash-preview` model

### Environment Variables Required
```
MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KALSHI_API_KEY=
GEMINI_API_KEY=
```

### Data Refresh Strategy
1. Cron job triggers at 4am Pacific (12:00 UTC)
2. Fetch current prices from all three sources
3. Before updating, store current prices as historical snapshots
4. Calculate price changes against 1D/1W/1M historical data
5. Update database with new market data

Note: AI explanations are generated on-demand when users view the page, not during data refresh.

### Historical Price Lookup
- Query historical prices collection for closest timestamp to:
  - 24 hours ago (1 day)
  - 168 hours ago (1 week)
  - 720 hours ago (1 month, ~30 days)
- Only show price change if historical data exists

## Success Metrics

- Users can view top 20 market movers within 3 seconds of page load
- AI explanations for all 20 markets generated in parallel within 5 seconds
- Data refreshes successfully at 4am Pacific daily
- Manual "Update Data" refresh completes within 15-30 seconds
- AI explanations provide relevant context for price movements
- Zero sports or price-threshold markets appear in results
- Authentication flow completes in under 2 clicks

## Resolved Questions

1. **OAuth providers:** Google only for initial release
2. **Admin view:** Yes, include admin functionality to manually exclude specific markets
3. **Duplicate markets:** Show all markets even if they exist on multiple platforms (no deduplication). Future enhancement will add functionality to compare related markets and enable arbitrage trades.
4. **Update Data latency:** Target 15-30 seconds acceptable (3 APIs fetched in parallel, then bulk MongoDB writes)

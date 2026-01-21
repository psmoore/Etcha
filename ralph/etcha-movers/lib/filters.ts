/**
 * Category filtering utility for excluding sports and price-threshold markets
 */

// Sports keywords to exclude
const SPORTS_KEYWORDS = [
  'NBA',
  'NFL',
  'MLB',
  'NHL',
  'FIFA',
  'soccer',
  'football',
  'basketball',
  'baseball',
  'hockey',
  'tennis',
  'golf',
  'boxing',
  'UFC',
  'MMA',
  'cricket',
  'rugby',
  'Olympics',
  'Super Bowl',
  'World Series',
  'Stanley Cup',
  'points scored',
  'touchdowns',
  'home runs',
  'goals scored',
  'assists',
  'rebounds',
  'Australian Open',
  'French Open',
  'Wimbledon',
  'US Open tennis',
  'Grand Slam',
  'aces at the',
  'March Madness',
  'World Cup',
  'Premier League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'Champions League',
];

// Sports prop bet patterns (e.g., "yes LeBron James: 10+")
const SPORTS_PROP_PATTERNS = [
  /yes\s+[A-Z][a-z]+\s+[A-Z][a-z]+:\s*\d+\+/i, // "yes Name Name: 10+"
  /\d+\+,\s*yes\s+[A-Z]/i, // "10+, yes Name"
  /Over\s+\d+\.?\d*\s+points/i, // "Over 229.5 points"
  /Under\s+\d+\.?\d*\s+points/i, // "Under 229.5 points"
];

// NBA team cities that appear in prop bet markets
const NBA_TEAM_INDICATORS = [
  'Los Angeles L', 'Los Angeles C', 'Golden State', 'New England',
  'San Antonio', 'New Orleans', 'Oklahoma City',
];

// Regex patterns for price threshold markets
const PRICE_THRESHOLD_PATTERNS = [
  /\b(BTC|Bitcoin)\s+(above|below|reach|hit|at)\s+\$[\d,]+/i,
  /\bWill\s+(ETH|Ethereum)\s+reach\s+\$[\d,]+/i,
  /\bWill\s+(BTC|Bitcoin)\s+reach\s+\$[\d,]+/i,
  /\b(ETH|Ethereum)\s+(above|below|reach|hit|at)\s+\$[\d,]+/i,
  /\bprice\s+(above|below|reach)\s+\$[\d,]+/i,
];

// Topics that should NOT be excluded
const ALLOWED_TOPICS = [
  'politics',
  'election',
  'elections',
  'regulation',
  'technology',
  'AI',
  'artificial intelligence',
  'companies',
  'company',
];

/**
 * Check if text contains any sports keywords (case-insensitive word boundary match)
 */
function containsSportsKeyword(text: string): boolean {
  const lowerText = text.toLowerCase();

  return SPORTS_KEYWORDS.some((keyword) => {
    // For acronyms (all caps), use exact match
    if (keyword === keyword.toUpperCase()) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(text);
    }
    // For regular words, case-insensitive match
    return lowerText.includes(keyword.toLowerCase());
  });
}

/**
 * Check if text matches sports prop bet patterns
 */
function matchesSportsPropPattern(text: string): boolean {
  return SPORTS_PROP_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Check if text contains NBA team indicators
 */
function containsNBATeamIndicator(text: string): boolean {
  return NBA_TEAM_INDICATORS.some((indicator) => text.includes(indicator));
}

/**
 * Check if text matches price threshold patterns
 */
function matchesPriceThresholdPattern(text: string): boolean {
  return PRICE_THRESHOLD_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Check if market is about an allowed topic (politics, elections, etc.)
 * These should never be excluded
 */
function isAllowedTopic(text: string): boolean {
  const lowerText = text.toLowerCase();
  return ALLOWED_TOPICS.some((topic) => lowerText.includes(topic.toLowerCase()));
}

/**
 * Determines if a market should be excluded from the top-20 display.
 *
 * @param title - The market title/name
 * @param description - The market description
 * @param category - The market category (optional)
 * @returns true if the market should be excluded, false otherwise
 */
export function shouldExcludeMarket(
  title: string,
  description: string,
  category?: string
): boolean {
  // Combine all text for analysis
  const combinedText = `${title} ${description} ${category || ''}`;

  // If it's about an allowed topic, don't exclude
  if (isAllowedTopic(combinedText)) {
    return false;
  }

  // Exclude if contains sports keywords
  if (containsSportsKeyword(combinedText)) {
    return true;
  }

  // Exclude if matches sports prop bet patterns (e.g., "yes LeBron James: 10+")
  if (matchesSportsPropPattern(combinedText)) {
    return true;
  }

  // Exclude if contains NBA team indicators
  if (containsNBATeamIndicator(combinedText)) {
    return true;
  }

  // Exclude if matches price threshold patterns
  if (matchesPriceThresholdPattern(combinedText)) {
    return true;
  }

  // Don't exclude by default
  return false;
}

import { shouldExcludeMarket } from './filters';

describe('shouldExcludeMarket', () => {
  describe('sports markets', () => {
    it('should exclude markets with NBA keyword', () => {
      expect(shouldExcludeMarket('NBA Finals Winner', 'Who will win the NBA finals', '')).toBe(true);
    });

    it('should exclude markets with NFL keyword', () => {
      expect(shouldExcludeMarket('Super Bowl Champion', 'NFL championship game', '')).toBe(true);
    });

    it('should exclude markets with MLB keyword', () => {
      expect(shouldExcludeMarket('World Series Winner', 'MLB playoffs', '')).toBe(true);
    });

    it('should exclude markets with NHL keyword', () => {
      expect(shouldExcludeMarket('Stanley Cup Winner', 'NHL playoffs', '')).toBe(true);
    });

    it('should exclude markets with FIFA keyword', () => {
      expect(shouldExcludeMarket('FIFA World Cup Winner', 'International soccer tournament', '')).toBe(true);
    });

    it('should exclude markets with soccer keyword', () => {
      expect(shouldExcludeMarket('Champions League Winner', 'European soccer competition', '')).toBe(true);
    });

    it('should exclude markets with football keyword', () => {
      expect(shouldExcludeMarket('Monday Night Football', 'Weekly football game predictions', '')).toBe(true);
    });

    it('should exclude markets with basketball keyword', () => {
      expect(shouldExcludeMarket('March Madness Winner', 'College basketball tournament', '')).toBe(true);
    });

    it('should exclude markets with baseball keyword', () => {
      expect(shouldExcludeMarket('Home Run Leader', 'Baseball season leader', '')).toBe(true);
    });

    it('should exclude markets with hockey keyword', () => {
      expect(shouldExcludeMarket('Hockey Championship', 'Ice hockey tournament', '')).toBe(true);
    });

    it('should exclude markets with tennis keyword', () => {
      expect(shouldExcludeMarket('Wimbledon Winner', 'Tennis grand slam', '')).toBe(true);
    });

    it('should exclude markets with golf keyword', () => {
      expect(shouldExcludeMarket('Masters Winner', 'Golf tournament', '')).toBe(true);
    });

    it('should exclude markets with boxing keyword', () => {
      expect(shouldExcludeMarket('Heavyweight Championship', 'Boxing match', '')).toBe(true);
    });

    it('should exclude markets with UFC keyword', () => {
      expect(shouldExcludeMarket('UFC 300 Main Event', 'Mixed martial arts', '')).toBe(true);
    });

    it('should exclude markets with MMA keyword', () => {
      expect(shouldExcludeMarket('MMA Championship', 'Mixed martial arts fighting', '')).toBe(true);
    });

    it('should exclude markets with cricket keyword', () => {
      expect(shouldExcludeMarket('Cricket World Cup', 'International cricket tournament', '')).toBe(true);
    });

    it('should exclude markets with rugby keyword', () => {
      expect(shouldExcludeMarket('Rugby World Cup', 'International rugby tournament', '')).toBe(true);
    });

    it('should exclude markets with Olympics keyword', () => {
      expect(shouldExcludeMarket('2028 Olympics Host', 'Olympic games', '')).toBe(true);
    });
  });

  describe('price threshold markets', () => {
    it('should exclude BTC above $X pattern', () => {
      expect(shouldExcludeMarket('BTC above $100,000', 'Will Bitcoin cross this threshold', '')).toBe(true);
    });

    it('should exclude Bitcoin reach $X pattern', () => {
      expect(shouldExcludeMarket('Will Bitcoin reach $150,000', 'Price prediction for BTC', '')).toBe(true);
    });

    it('should exclude ETH reach $X pattern', () => {
      expect(shouldExcludeMarket('Will ETH reach $10,000', 'Ethereum price prediction', '')).toBe(true);
    });

    it('should exclude Ethereum above $X pattern', () => {
      expect(shouldExcludeMarket('Ethereum above $5000', 'Price threshold market', '')).toBe(true);
    });

    it('should exclude Will BTC reach $X pattern', () => {
      expect(shouldExcludeMarket('Will BTC reach $200000', 'Bitcoin price milestone', '')).toBe(true);
    });

    it('should exclude price below $X pattern', () => {
      expect(shouldExcludeMarket('Token price below $50', 'Crypto price prediction', '')).toBe(true);
    });
  });

  describe('allowed topics - politics', () => {
    it('should NOT exclude markets about politics', () => {
      expect(shouldExcludeMarket('2024 Presidential Election', 'Will the incumbent win?', 'politics')).toBe(false);
    });

    it('should NOT exclude markets about elections', () => {
      expect(shouldExcludeMarket('Senate Race Results', 'Which party wins the election', '')).toBe(false);
    });

    it('should NOT exclude markets about regulation', () => {
      expect(shouldExcludeMarket('Crypto Regulation', 'Will new regulation pass', '')).toBe(false);
    });

    it('should NOT exclude markets about technology', () => {
      expect(shouldExcludeMarket('Tech IPO Success', 'Technology company goes public', '')).toBe(false);
    });

    it('should NOT exclude markets about AI', () => {
      expect(shouldExcludeMarket('AI Breakthrough', 'Artificial intelligence milestone', '')).toBe(false);
    });

    it('should NOT exclude markets about companies', () => {
      expect(shouldExcludeMarket('Apple Revenue Growth', 'Company earnings prediction', '')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should NOT exclude general markets without sports or price keywords', () => {
      expect(shouldExcludeMarket('Climate Agreement', 'Will countries reach agreement', '')).toBe(false);
    });

    it('should NOT exclude markets with allowed topic even if category has sports word', () => {
      // If a politics market somehow has sports in it but is clearly about politics
      expect(shouldExcludeMarket('Election Results', 'Political election outcome', 'politics')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(shouldExcludeMarket('', '', '')).toBe(false);
    });

    it('should handle undefined category', () => {
      expect(shouldExcludeMarket('General Market', 'Some description', undefined)).toBe(false);
    });

    it('should be case insensitive for sports keywords', () => {
      expect(shouldExcludeMarket('nba finals', 'basketball championship', '')).toBe(true);
      expect(shouldExcludeMarket('SOCCER match', 'FOOTBALL game', '')).toBe(true);
    });
  });
});

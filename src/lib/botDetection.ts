/**
 * Bot Detection Utility for GTM Traffic Filtering
 * 
 * Detects automated browsers, headless Chrome, Puppeteer, Selenium, etc.
 * Pushes `is_bot` and `bot_signals` to the dataLayer for GTM filtering.
 * 
 * Use in GTM: Create a "Real Human Traffic" trigger that excludes `is_bot === true`
 */

export interface BotDetectionResult {
  isBot: boolean;
  signals: string[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Detect if the current browser is likely a bot or automated tool
 * 
 * Checks for:
 * - navigator.webdriver (Selenium, Puppeteer, Playwright)
 * - Headless Chrome/Firefox User-Agent strings
 * - Missing browser APIs that bots often lack
 * - Phantom.js, Nightmare.js signatures
 * - Chrome DevTools Protocol automation
 */
export function detectBot(): BotDetectionResult {
  const signals: string[] = [];
  
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isBot: true, signals: ['no_window'], confidence: 'high' };
  }

  // 1. WebDriver flag (Selenium, Puppeteer, Playwright set this)
  if ((navigator as any).webdriver === true) {
    signals.push('webdriver');
  }

  // 2. Headless User-Agent detection
  const ua = navigator.userAgent.toLowerCase();
  const headlessPatterns = [
    'headlesschrome',
    'headlessfirefox', 
    'phantomjs',
    'nightmare',
    'electron',
    'puppeteer',
    'playwright',
    'selenium',
    'webdriver',
    'bot',
    'crawl',
    'spider',
    'scrape',
    'lighthouse', // Audit tool, not malicious but automated
  ];
  
  for (const pattern of headlessPatterns) {
    if (ua.includes(pattern)) {
      signals.push(`ua_${pattern}`);
    }
  }

  // 3. Check for missing browser features (bots often have incomplete implementations)
  if (!(window as any).chrome && ua.includes('chrome') && !ua.includes('mobile')) {
    signals.push('fake_chrome');
  }

  // 4. Check for automation extensions (CDP, etc.)
  if ((window as any)._phantom || (window as any).__nightmare) {
    signals.push('phantom_nightmare');
  }

  // 5. Check for Puppeteer/Playwright runtime signatures
  if ((window as any).__puppeteer_evaluation_script__) {
    signals.push('puppeteer_eval');
  }

  // 6. Check document.hidden inconsistencies
  // Headless browsers sometimes report always visible
  if (typeof document.hidden === 'undefined') {
    signals.push('no_visibility_api');
  }

  // 7. Check for cdc_ properties (ChromeDriver detection)
  const cdcPattern = /^cdc_/;
  for (const prop in (window as any)) {
    if (cdcPattern.test(prop)) {
      signals.push('chromedriver_cdc');
      break;
    }
  }

  // 8. Check navigator.plugins (often empty or fake in headless)
  if (navigator.plugins && navigator.plugins.length === 0 && !ua.includes('mobile')) {
    signals.push('no_plugins');
  }

  // 9. Check navigator.languages (should have at least one)
  if (!navigator.languages || navigator.languages.length === 0) {
    signals.push('no_languages');
  }

  // 10. Check for permissions API (missing in some older bots)
  if (typeof navigator.permissions === 'undefined') {
    signals.push('no_permissions_api');
  }

  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'low';
  
  // High confidence signals (definitive bot indicators)
  const highConfidenceSignals = ['webdriver', 'ua_headlesschrome', 'ua_puppeteer', 'ua_playwright', 'chromedriver_cdc', 'phantom_nightmare'];
  const hasHighConfidence = signals.some(s => highConfidenceSignals.includes(s));
  
  // Medium confidence (suspicious but not definitive)
  const mediumConfidenceSignals = ['fake_chrome', 'puppeteer_eval', 'no_plugins'];
  const hasMediumConfidence = signals.some(s => mediumConfidenceSignals.includes(s));

  if (hasHighConfidence) {
    confidence = 'high';
  } else if (hasMediumConfidence || signals.length >= 2) {
    confidence = 'medium';
  } else if (signals.length === 1) {
    confidence = 'low';
  }

  const isBot = signals.length > 0 && (confidence === 'high' || confidence === 'medium');

  return { isBot, signals, confidence };
}

/**
 * Push bot detection result to GTM dataLayer
 * Should be called once on page load, before other events
 */
export function pushBotSignalToDataLayer(): BotDetectionResult {
  const result = detectBot();
  
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'bot_detection',
      is_bot: result.isBot,
      bot_signals: result.signals,
      bot_confidence: result.confidence,
      bot_signal_count: result.signals.length,
    });

    if (import.meta.env.DEV) {
      console.log('[Bot Detection]', result.isBot ? '🤖 Bot detected' : '✅ Human traffic', result);
    }
  }

  return result;
}

/**
 * Get cached bot detection result (doesn't re-run detection)
 * Useful for including in conversion events
 */
let cachedResult: BotDetectionResult | null = null;

export function getBotDetectionResult(): BotDetectionResult {
  if (!cachedResult) {
    cachedResult = detectBot();
  }
  return cachedResult;
}

/**
 * Check if current session is flagged as bot
 * Quick helper for conditional logic
 */
export function isBot(): boolean {
  return getBotDetectionResult().isBot;
}

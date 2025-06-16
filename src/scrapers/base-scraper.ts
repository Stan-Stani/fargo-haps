import { chromium, Browser, Page } from 'playwright';
import { Event, EventScraper, EventSource, ScrapedEventData } from '../types';
import { parseISO, parse } from 'date-fns';

export abstract class BaseScraper implements EventScraper {
  protected browser: Browser | null = null;
  protected page: Page | null = null;

  abstract getSource(): EventSource;
  abstract getUrl(): string;
  abstract scrapeEventData(): Promise<ScrapedEventData[]>;

  async scrape(): Promise<Event[]> {
    try {
      await this.initBrowser();
      const scrapedData = await this.scrapeEventData();
      return this.processEventData(scrapedData);
    } finally {
      await this.closeBrowser();
    }
  }

  protected async initBrowser(): Promise<void> {
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });
  }

  protected async closeBrowser(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  protected async navigateToPage(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    await this.page.goto(this.getUrl(), { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
  }

  protected processEventData(scrapedData: ScrapedEventData[]): Event[] {
    return scrapedData.map(data => {
      let dateString = data.dateString;
      
      // If no date found or dateString is too short/invalid, try to extract from URL
      const trimmedDate = dateString ? dateString.trim() : '';
      const hasProperDateFormat = trimmedDate.match(/^\d{4}-\d{2}-\d{2}$/) || 
                                 trimmedDate.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}$/i) ||
                                 trimmedDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
      
      const isInvalidDate = !dateString || trimmedDate.length < 6 || !hasProperDateFormat;
      
      if (isInvalidDate && data.url) {
        const urlDateMatch = data.url.match(/(\d{4}-\d{2}-\d{2})/);
        if (urlDateMatch) {
          dateString = urlDateMatch[1];
        }
      }
      
      return {
        title: data.title,
        description: data.description,
        date: this.parseDate(dateString),
        endDate: data.endDateString ? this.parseDate(data.endDateString) : undefined,
        location: data.location,
        url: data.url,
        source: this.getSource(),
        category: data.category,
        price: data.price,
        imageUrl: data.imageUrl
      };
    });
  }

  protected parseDate(dateString: string): Date {
    try {
      if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
        return parseISO(dateString);
      }
      
      const commonFormats = [
        'MMM dd, yyyy',
        'MMMM dd, yyyy', 
        'MM/dd/yyyy',
        'dd/MM/yyyy',
        'yyyy-MM-dd'
      ];

      for (const format of commonFormats) {
        try {
          return parse(dateString, format, new Date());
        } catch {
          continue;
        }
      }
      
      const fallbackDate = new Date(dateString);
      return isNaN(fallbackDate.getTime()) ? new Date() : fallbackDate;
    } catch {
      return new Date();
    }
  }
}
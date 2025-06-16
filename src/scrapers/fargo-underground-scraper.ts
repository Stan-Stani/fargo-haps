import { BaseScraper } from './base-scraper';
import { EventSource, ScrapedEventData } from '../types';

export class FargoUndergroundScraper extends BaseScraper {
  getSource(): EventSource {
    return EventSource.FARGO_UNDERGROUND;
  }

  getUrl(): string {
    return 'https://fargounderground.com/events/photo/';
  }

  async scrapeEventData(): Promise<ScrapedEventData[]> {
    if (!this.page) throw new Error('Page not initialized');
    
    try {
      await this.navigateToPage();
      
      // Wait for page content to load and check for common content
      await this.page.waitForTimeout(5000);
      
      // Try to wait for some content to appear
      try {
        await this.page.waitForSelector('body', { timeout: 10000 });
      } catch (e) {
        console.log('Body selector timeout, continuing anyway...');
      }
      
      console.log('Fargo Underground events page loaded, looking for events...');
    } catch (error) {
      console.error('Error navigating to Fargo Underground:', error);
      // Try the main events page as fallback
      try {
        await this.page.goto('https://fargounderground.com/events/', { 
          waitUntil: 'domcontentloaded',
          timeout: 60000 
        });
        await this.page.waitForTimeout(5000);
        console.log('Loaded fallback events page');
      } catch (fallbackError) {
        console.error('Fallback page also failed:', fallbackError);
        return [];
      }
    }

    const events = await this.page.evaluate(() => {
      // Get the current page date context from the datepicker button
      let pageDateContext = '';
      const datepickerButton = document.querySelector('.tribe-common-h3.tribe-events-c-top-bar__datepicker-button');
      if (datepickerButton) {
        pageDateContext = datepickerButton.textContent?.trim() || '';
        console.log(`Page date context: ${pageDateContext}`);
      }
      
      // Target specific event selectors for the events page
      const possibleSelectors = [
        'article.event',
        '.event-item',
        '.event-listing',
        'article[class*="event"]',
        '.tribe-event',
        '.event-card',
        'article.post',
        'article'
      ];
      
      let eventElements: NodeListOf<Element> | null = null;
      
      for (const selector of possibleSelectors) {
        const found = document.querySelectorAll(selector);
        if (found.length > 0) {
          console.log(`Found ${found.length} events with selector: ${selector}`);
          eventElements = found;
          break;
        }
      }

      if (!eventElements || eventElements.length === 0) {
        console.log('No event elements found on Fargo Underground events page');
        return [];
      }

      const results: ScrapedEventData[] = [];

      eventElements.forEach((element, index) => {
        try {
          // Look for event titles
          const titleElement = element.querySelector('h1, h2, h3, h4, .event-title, .entry-title, [class*="title"]');
          const title = titleElement?.textContent?.trim();
          
          if (!title || title.length < 3) {
            console.log(`Skipping event ${index + 1}: no valid title`);
            return;
          }

          // Skip venue pages and non-event content
          if (title.match(/^(Cowboy Jack's|Duffy's Tavern|Parachigo)$/i)) {
            return;
          }

          // Extract description
          const descriptionElement = element.querySelector('.event-description, .entry-content, .excerpt, p, [class*="description"]');
          const description = descriptionElement?.textContent?.trim();

          // Extract URL first (needed for date extraction)
          const linkElement = element.querySelector('a') as HTMLAnchorElement;
          let url = linkElement?.href;
          if (url && !url.startsWith('http')) {
            url = new URL(url, 'https://fargounderground.com').href;
          }
          // Look for date information in multiple ways
          let dateString = '';
          
          // First try standard date elements
          const dateElement = element.querySelector('.event-date, .date, time, [datetime], [class*="date"]');
          if (dateElement) {
            dateString = dateElement.getAttribute('datetime') || 
                        dateElement.getAttribute('data-date') ||
                        dateElement.textContent?.trim() || '';
          }
          
          // Try to find date in the element's text content
          if (!dateString) {
            const elementText = element.textContent || '';
            const datePatterns = [
              /(\w{3,9}\s+\d{1,2},?\s+\d{4})/i,  // "June 15, 2025" or "Jun 15 2025"
              /(\d{1,2}\/\d{1,2}\/\d{4})/,       // "6/15/2025"
              /(\d{4}-\d{2}-\d{2})/,             // "2025-06-15"
              /(\w{3,9}\s+\d{1,2})/i             // "June 15" (without year)
            ];
            
            for (const pattern of datePatterns) {
              const match = elementText.match(pattern);
              if (match) {
                dateString = match[1];
                break;
              }
            }
          }
          
          // If still no date found, use the page date context from datepicker
          if (!dateString && pageDateContext) {
            dateString = pageDateContext;
            console.log(`Using page date context for "${title}": ${pageDateContext}`);
          }
          

          // Extract location
          const locationElement = element.querySelector('.event-location, .location, .venue, [class*="location"], [class*="venue"]');
          const location = locationElement?.textContent?.trim();

          // Extract image
          const imageElement = element.querySelector('img') as HTMLImageElement;
          const imageUrl = imageElement?.src;

          // Extract category
          const categoryElement = element.querySelector('.category, .event-category, .tag, [class*="category"]');
          const category = categoryElement?.textContent?.trim();


          results.push({
            title,
            description,
            dateString: dateString || '',
            location,
            url,
            imageUrl,
            category
          });
        } catch (error) {
          console.warn(`Error parsing event element ${index + 1}:`, error);
        }
      });

      console.log(`Fargo Underground scraper found ${results.length} valid events`);
      return results;
    });

    return events;
  }
}
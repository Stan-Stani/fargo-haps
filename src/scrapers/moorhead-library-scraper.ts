import { BaseScraper } from './base-scraper';
import { EventSource, ScrapedEventData } from '../types';

export class MoorheadLibraryScraper extends BaseScraper {
  getSource(): EventSource {
    return EventSource.MOORHEAD_LIBRARY;
  }

  getUrl(): string {
    return 'https://larl.libnet.info/events?n=3&l=Moorhead+Public+Library&r=months';
  }

  async scrapeEventData(): Promise<ScrapedEventData[]> {
    if (!this.page) throw new Error('Page not initialized');
    
    await this.navigateToPage();
    
    try {
      await this.page.waitForSelector('.event, .program, .listing, [class*="event"], [class*="program"]', { timeout: 10000 });
    } catch {
      console.warn('No events found on Moorhead Library page');
      return [];
    }

    const events = await this.page.evaluate(() => {
      const eventElements = document.querySelectorAll('.event, .program, .listing, .item, [class*="event"], [class*="program"], tr');
      const results: ScrapedEventData[] = [];

      eventElements.forEach(element => {
        try {
          let titleElement = element.querySelector('h2, h3, h4, .title, .event-title, .program-title, [class*="title"], a');
          if (!titleElement && element.tagName === 'TR') {
            const cells = element.querySelectorAll('td');
            if (cells.length > 0) {
              titleElement = cells[0];
            }
          }
          
          const title = titleElement?.textContent?.trim();
          
          if (!title || title.length < 3) return;


          let descriptionElement = element.querySelector('.description, .content, .excerpt, p, [class*="description"]');
          if (!descriptionElement && element.tagName === 'TR') {
            const cells = element.querySelectorAll('td');
            if (cells.length > 1) {
              descriptionElement = cells[1];
            }
          }
          const description = descriptionElement?.textContent?.trim();

          let dateElement = element.querySelector('.date, .event-date, time, [class*="date"]');
          if (!dateElement && element.tagName === 'TR') {
            const cells = element.querySelectorAll('td');
            for (let i = 0; i < cells.length; i++) {
              const cell = cells[i];
              const cellText = cell.textContent?.trim() || '';
              if (cellText.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i)) {
                dateElement = cell;
                break;
              }
            }
          }
          
          let dateString = dateElement?.textContent?.trim() || '';
          if (!dateString) {
            const dateAttr = dateElement?.getAttribute('datetime');
            if (dateAttr) dateString = dateAttr;
          }

          const locationElement = element.querySelector('.location, .venue, [class*="location"]');
          const location = locationElement?.textContent?.trim() || 'Moorhead Public Library';

          const linkElement = element.querySelector('a');
          let url = linkElement?.href;
          if (url && !url.startsWith('http')) {
            url = new URL(url, 'https://larl.libnet.info').href;
          }

          const imageElement = element.querySelector('img');
          const imageUrl = imageElement?.src;

          results.push({
            title,
            description,
            dateString: dateString || new Date().toISOString(),
            location,
            url,
            imageUrl,
            category: 'Library Program'
          });
        } catch (error) {
          console.warn('Error parsing library event element:', error);
        }
      });

      return results.filter(event => event.title && event.title.length > 2);
    });

    return events;
  }
}
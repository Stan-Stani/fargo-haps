import { BaseScraper } from './base-scraper';
import { EventSource, ScrapedEventData } from '../types';

export class FargoMoorheadScraper extends BaseScraper {
  getSource(): EventSource {
    return EventSource.FARGO_MOORHEAD;
  }

  getUrl(): string {
    return 'https://www.fargomoorhead.org/events/';
  }

  async scrapeEventData(): Promise<ScrapedEventData[]> {
    if (!this.page) throw new Error('Page not initialized');
    
    await this.navigateToPage();
    
    // Wait for page content to load
    await this.page.waitForTimeout(3000);
    
    console.log('Fargo-Moorhead page loaded, looking for events...');
    
    const events = await this.page.evaluate(() => {
      // Target the specific structure you provided
      const eventElements = document.querySelectorAll('div[data-type="events"]');
      console.log(`Found ${eventElements.length} events with data-type="events"`);
      
      if (eventElements.length === 0) {
        console.log('No events found with data-type="events", trying fallback selectors...');
        return [];
      }

      const results: ScrapedEventData[] = [];

      eventElements.forEach((element, index) => {
        try {
          // Extract title from h4 > a structure
          const titleElement = element.querySelector('h4 a, h3 a, h2 a, .info h4, .top-info h4');
          const title = titleElement?.textContent?.trim();
          
          if (!title || title.length < 3) {
            console.log(`Skipping event ${index + 1}: no valid title`);
            return;
          }

          // Extract description if available
          const descriptionElement = element.querySelector('.description, .excerpt, .summary, .info p, .bottom-info');
          const description = descriptionElement?.textContent?.trim();

          // Extract date from mini-date-container structure
          let dateString = '';
          const monthElement = element.querySelector('.mini-date-container .month');
          const dayElement = element.querySelector('.mini-date-container .day');
          
          if (monthElement && dayElement) {
            const month = monthElement.textContent?.trim();
            const day = dayElement.textContent?.trim();
            const currentYear = new Date().getFullYear();
            dateString = `${month} ${day}, ${currentYear}`;
            console.log(`Extracted date: ${dateString}`);
          }

          // Extract location if available
          const locationElement = element.querySelector('.location, .venue, .address, .info .location');
          const location = locationElement?.textContent?.trim();

          // Extract URL from the main link
          const linkElement = element.querySelector('a[href*="/event/"]') as HTMLAnchorElement;
          let url = linkElement?.href;
          if (url && !url.startsWith('http')) {
            url = new URL(url, 'https://www.fargomoorhead.org').href;
          }

          // Extract image
          const imageElement = element.querySelector('img.thumb, .image img') as HTMLImageElement;
          const imageUrl = imageElement?.src;

          console.log(`Event ${index + 1}: "${title}" - Date: "${dateString}" - URL: ${url}`);

          results.push({
            title,
            description,
            dateString: dateString || new Date().toISOString(),
            location,
            url,
            imageUrl
          });
        } catch (error) {
          console.warn(`Error parsing event element ${index + 1}:`, error);
        }
      });

      console.log(`Fargo-Moorhead scraper found ${results.length} valid events`);
      return results;
    });

    return events;
  }
}
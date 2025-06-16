import { Event, EventScraper } from './types';
import { FargoMoorheadScraper, FargoUndergroundScraper, MoorheadLibraryScraper } from './scrapers';

export class EventAggregator {
  private scrapers: EventScraper[];

  constructor() {
    this.scrapers = [
      new FargoMoorheadScraper(),
      new FargoUndergroundScraper(),
      new MoorheadLibraryScraper()
    ];
  }

  async aggregateEvents(): Promise<Event[]> {
    console.log('Starting event aggregation...');
    
    const allEvents: Event[] = [];
    const scrapePromises = this.scrapers.map(async (scraper) => {
      try {
        console.log(`Scraping ${scraper.getSource()}...`);
        const events = await scraper.scrape();
        console.log(`Found ${events.length} events from ${scraper.getSource()}`);
        
        // Save individual scraper results to separate files for debugging
        const filename = `debug-${scraper.getSource().replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
        await this.exportToJson(events, filename);
        console.log(`Debug file saved: ${filename}`);
        
        return events;
      } catch (error) {
        console.error(`Error scraping ${scraper.getSource()}:`, error);
        return [];
      }
    });

    const results = await Promise.all(scrapePromises);
    
    for (const events of results) {
      allEvents.push(...events);
    }

    const deduplicatedEvents = this.deduplicateEvents(allEvents);
    const sortedEvents = this.sortEventsByDate(deduplicatedEvents);
    
    console.log(`Total events aggregated: ${sortedEvents.length}`);
    return sortedEvents;
  }

  private deduplicateEvents(events: Event[]): Event[] {
    const seen = new Set<string>();
    const deduplicated: Event[] = [];

    for (const event of events) {
      const key = this.generateEventKey(event);
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(event);
      }
    }

    return deduplicated;
  }

  private generateEventKey(event: Event): string {
    const normalizedTitle = event.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const dateKey = isNaN(event.date.getTime()) ? 'invalid-date' : event.date.toISOString().split('T')[0];
    const locationKey = event.location?.toLowerCase().replace(/[^\w\s]/g, '').trim() || '';
    
    return `${normalizedTitle}-${dateKey}-${locationKey}`;
  }

  private sortEventsByDate(events: Event[]): Event[] {
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async exportToJson(events: Event[], filename?: string): Promise<string> {
    const fs = await import('fs').then(m => m.promises);
    const path = filename || `fargo-events-${new Date().toISOString().split('T')[0]}.json`;
    
    const exportData = {
      generated: new Date().toISOString(),
      count: events.length,
      events: events.map(event => ({
        ...event,
        date: isNaN(event.date.getTime()) ? null : event.date.toISOString(),
        endDate: event.endDate && !isNaN(event.endDate.getTime()) ? event.endDate.toISOString() : null
      }))
    };

    await fs.writeFile(path, JSON.stringify(exportData, null, 2));
    console.log(`Events exported to ${path}`);
    return path;
  }

  async exportToCsv(events: Event[], filename?: string): Promise<string> {
    const fs = await import('fs').then(m => m.promises);
    const path = filename || `fargo-events-${new Date().toISOString().split('T')[0]}.csv`;
    
    const headers = ['Title', 'Date', 'End Date', 'Location', 'Description', 'Category', 'Price', 'Source', 'URL'];
    const csvContent = [
      headers.join(','),
      ...events.map(event => [
        this.escapeCsvField(event.title),
        event.date.toISOString(),
        event.endDate?.toISOString() || '',
        this.escapeCsvField(event.location || ''),
        this.escapeCsvField(event.description || ''),
        this.escapeCsvField(event.category || ''),
        this.escapeCsvField(event.price || ''),
        event.source,
        this.escapeCsvField(event.url || '')
      ].join(','))
    ].join('\n');

    await fs.writeFile(path, csvContent);
    console.log(`Events exported to ${path}`);
    return path;
  }

  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}
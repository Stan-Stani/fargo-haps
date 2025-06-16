export interface Event {
  title: string;
  description?: string;
  date: Date;
  endDate?: Date;
  location?: string;
  url?: string;
  source: EventSource;
  category?: string;
  price?: string;
  imageUrl?: string;
}

export enum EventSource {
  FARGO_MOORHEAD = 'fargomoorhead.org',
  FARGO_UNDERGROUND = 'fargounderground.com',
  MOORHEAD_LIBRARY = 'Moorhead Public Library'
}

export interface ScrapedEventData {
  title: string;
  description?: string;
  dateString: string;
  endDateString?: string;
  location?: string;
  url?: string;
  category?: string;
  price?: string;
  imageUrl?: string;
}

export interface EventScraper {
  scrape(): Promise<Event[]>;
  getSource(): EventSource;
}
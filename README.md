# Fargo Haps

A TypeScript-based event aggregator that scrapes events from multiple Fargo-Moorhead area websites using Playwright.

## Features

- Scrapes events from:
  - [Fargo-Moorhead.org Events](https://www.fargomoorhead.org/events/)
  - [Fargo Underground](https://fargounderground.com/)
  - [Moorhead Public Library Events](https://larl.libnet.info/events?n=3&l=Moorhead+Public+Library&r=months)
- Deduplicates events across sources
- Exports to JSON and CSV formats
- CLI interface for easy usage
- TypeScript for type safety

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd fargo-haps

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### CLI Commands

**Scrape and save events:**
```bash
# Save as JSON (default)
npm run scrape

# Save as CSV
npm run scrape -- --format csv

# Save as both JSON and CSV
npm run scrape -- --format both

# Custom filename
npm run scrape -- --output my-events
```

**List events without saving:**
```bash
# Show first 10 events
npm run dev list

# Show first 20 events
npm run dev list -- --limit 20
```

### Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Project Structure

```
src/
├── types/          # TypeScript interfaces and types
├── scrapers/       # Individual website scrapers
├── utils/          # Utility functions (logging, etc.)
├── aggregator.ts   # Main aggregation logic
└── index.ts        # CLI interface
```

## How It Works

1. **Scraping**: Each scraper uses Playwright to navigate to a website and extract event data
2. **Normalization**: Raw scraped data is converted to a standardized Event interface
3. **Deduplication**: Events are deduplicated based on title, date, and location
4. **Sorting**: Events are sorted chronologically
5. **Export**: Events can be exported to JSON or CSV format

## Event Data Structure

Each event contains:
- Title
- Date and optional end date
- Location
- Description (when available)
- Source website
- URL (when available)
- Category (when available)
- Price information (when available)
- Image URL (when available)

## Error Handling

- Individual scraper failures don't stop the entire process
- Network timeouts and missing elements are handled gracefully
- Detailed logging helps with debugging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
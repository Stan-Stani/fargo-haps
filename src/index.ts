#!/usr/bin/env node

import { Command } from 'commander';
import { EventAggregator } from './aggregator';

const program = new Command();

program
  .name('fargo-haps')
  .description('Aggregate events from Fargo-Moorhead area websites')
  .version('1.0.0');

program
  .command('scrape')
  .description('Scrape and aggregate events from all sources')
  .option('-f, --format <format>', 'Output format (json|csv|both)', 'json')
  .option('-o, --output <filename>', 'Output filename (without extension)')
  .action(async (options) => {
    try {
      const aggregator = new EventAggregator();
      const events = await aggregator.aggregateEvents();
      
      if (events.length === 0) {
        console.log('No events found.');
        return;
      }

      const baseFilename = options.output || `fargo-events-${new Date().toISOString().split('T')[0]}`;
      
      if (options.format === 'json' || options.format === 'both') {
        await aggregator.exportToJson(events, `${baseFilename}.json`);
      }
      
      if (options.format === 'csv' || options.format === 'both') {
        await aggregator.exportToCsv(events, `${baseFilename}.csv`);
      }
      
      console.log(`\nSummary:`);
      console.log(`- Total events: ${events.length}`);
      console.log(`- Date range: ${events[0]?.date.toDateString()} to ${events[events.length - 1]?.date.toDateString()}`);
      
      const sourceBreakdown = events.reduce((acc, event) => {
        acc[event.source] = (acc[event.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log(`- Sources:`);
      Object.entries(sourceBreakdown).forEach(([source, count]) => {
        console.log(`  - ${source}: ${count} events`);
      });
      
    } catch (error) {
      console.error('Error during aggregation:', error);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List events without saving to file')
  .option('-l, --limit <number>', 'Limit number of events to display', '10')
  .action(async (options) => {
    try {
      const aggregator = new EventAggregator();
      const events = await aggregator.aggregateEvents();
      
      if (events.length === 0) {
        console.log('No events found.');
        return;
      }

      const limit = parseInt(options.limit);
      const eventsToShow = events.slice(0, limit);
      
      console.log(`\nUpcoming Events (showing ${eventsToShow.length} of ${events.length}):\n`);
      
      eventsToShow.forEach((event, index) => {
        console.log(`${index + 1}. ${event.title}`);
        console.log(`   Date: ${event.date.toDateString()}`);
        if (event.location) console.log(`   Location: ${event.location}`);
        if (event.category) console.log(`   Category: ${event.category}`);
        console.log(`   Source: ${event.source}`);
        if (event.url) console.log(`   URL: ${event.url}`);
        console.log();
      });
      
    } catch (error) {
      console.error('Error listing events:', error);
      process.exit(1);
    }
  });

if (process.argv.length === 2) {
  program.help();
}

program.parse();
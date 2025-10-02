#!/usr/bin/env node

/**
 * Test script to verify search API fix for category="undefined" issue
 */

const { listWebsitesD1 } = require('./.next/server/app/api/websites/route.js');

async function testSearch() {
  console.log('Testing search with category="undefined"...\n');

  const testParams = {
    page: 1,
    pageSize: 12,
    query: 'Hub',
    category: 'undefined', // This is the problematic value
    featured: false,
    includeAds: false,
    minRating: 0,
  };

  console.log('Test params:', testParams);

  try {
    const result = await listWebsitesD1(testParams);
    console.log('\n✅ Search completed successfully!');
    console.log(`Found ${result.total} results`);
    console.log('\nFirst few results:');
    result.rows.slice(0, 3).forEach((site, index) => {
      console.log(`${index + 1}. ${site.title} - ${site.url}`);
    });
  } catch (error) {
    console.error('\n❌ Search failed:', error.message);
    process.exit(1);
  }
}

testSearch();
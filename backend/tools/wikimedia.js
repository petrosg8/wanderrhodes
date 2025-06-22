// backend/tools/wikimedia.js
// Fetches a photo URL for a place using the Wikimedia / Wikipedia API with no API key required.
// Returns null if no suitable image is found.

import axios from 'axios';

export async function fetchWikimediaPhoto(query) {
  try {
    // Step 1: search Wikipedia for the query term
    const searchRes = await axios.get('https://en.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        list: 'search',
        srsearch: query,
        format: 'json',
        utf8: 1,
        origin: '*', // CORS
      },
    });

    const title = searchRes.data?.query?.search?.[0]?.title;
    if (!title) return null;

    // Step 2: request the page image (thumbnail)
    const pageRes = await axios.get('https://en.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        prop: 'pageimages',
        titles: title,
        format: 'json',
        pithumbsize: 800,
        origin: '*',
      },
    });

    const pages = pageRes.data?.query?.pages;
    const firstPage = pages ? pages[Object.keys(pages)[0]] : null;
    const url = firstPage?.thumbnail?.source ?? null;
    return url;
  } catch (err) {
    console.error('Wikimedia API error:', err.message);
    return null;
  }
} 
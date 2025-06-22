import { Client } from '@googlemaps/google-maps-services-js';
import axios from 'axios';
import { fetchWikimediaPhoto } from './wikimedia.js';

const client = new Client({});

async function fetchUnsplashPhoto(query) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;
  try {
    const res = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, orientation: 'landscape', per_page: 1 },
      headers: { Authorization: `Client-ID ${accessKey}` },
    });
    const photo = res.data.results?.[0];
    if (!photo) return null;
    return photo.urls?.regular || photo.urls?.full || null;
  } catch (err) {
    console.error('Unsplash error:', err.response?.status || err.code, err.message);
    return null;
  }
}

export async function getPlacePhoto(query) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error('GOOGLE_MAPS_API_KEY is not set in the environment variables.');
  }

  try {
    // 1. Find the place ID from the query
    const findPlaceRequest = await client.findPlaceFromText({
      params: {
        input: query,
        inputtype: 'textquery',
        fields: ['place_id', 'photos', 'name', 'formatted_address'],
        key,
      },
    });

    const candidate = findPlaceRequest.data.candidates[0];
    if (!candidate) {
      console.log(`No place found for query: "${query}"`);
      return null;
    }
    
    let photoUrl = null;
    const maxWidth = 800;
    if (candidate.photos && candidate.photos.length > 0) {
      const photoReference = candidate.photos[0].photo_reference;
      photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${key}`;
    }

    // Fallback: fetch Place Details to see if it contains photos not returned by FindPlaceFromText
    if (!photoUrl) {
      try {
        const details = await client.placeDetails({
          params: {
            place_id: candidate.place_id,
            fields: ['photos'],
            key,
          },
        });
        const detailsPhotos = details.data?.result?.photos;
        if (detailsPhotos && detailsPhotos.length > 0) {
          const ref = detailsPhotos[0].photo_reference;
          photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${ref}&key=${key}`;
        }
      } catch (e) {
        console.warn('Place Details photo fetch failed:', e.response?.status || e.code, e.message);
      }
    }

    if (!photoUrl) {
      console.log(`No Google photo found for query: "${query}"`);
    }

    // 1st fallback: Wikimedia (no key, immediate)
    if (!photoUrl) {
      photoUrl = await fetchWikimediaPhoto(query);
    }
    // 2nd fallback: Unsplash if Wikimedia had nothing
    if (!photoUrl) {
      photoUrl = await fetchUnsplashPhoto(query);
    }

    return {
      photoUrl,
      name: candidate.name,
      address: candidate.formatted_address,
    };

  } catch (error) {
    console.error(`Google Places API error for query "${query}":`, error.response?.data || error.message);
    // Wikimedia first
    const wikiUrl = await fetchWikimediaPhoto(query);
    if (wikiUrl) {
      return { photoUrl: wikiUrl };
    }
    // Unsplash second
    const fallbackUrl = await fetchUnsplashPhoto(query);
    if (fallbackUrl) {
      return { photoUrl: fallbackUrl };
    }
    throw error;
  }
} 
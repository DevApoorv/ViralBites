import { GoogleGenAI } from "@google/genai";
import { Coordinates, ViralPlace, GroundingSource, VideoLink, TestResult, UserSettings } from "../types";

// Helper to reliably extract JSON from model output (Objects or Arrays)
const extractJson = (text: string) => {
  try {
    // Match either a JSON object {} or array []
    const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    return match ? match[0] : "{}";
  } catch (e) {
    return "{}";
  }
};

// Haversine formula to calculate distance between two points in km
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return parseFloat(d.toFixed(1)); // Returns number
};

// DIAGNOSTICS / TESTS
export const runDiagnostics = async (coords: Coordinates): Promise<TestResult[]> => {
  const tests: TestResult[] = [];
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. Test Distance Math
  try {
    const dist = calculateDistance(0, 0, 0, 1);
    if (dist > 110 && dist < 112) {
      tests.push({ name: 'Distance Algorithm', status: 'PASS', message: `Calculated 1 deg ≈ ${dist}km` });
    } else {
      tests.push({ name: 'Distance Algorithm', status: 'FAIL', message: `Math error: ${dist}km` });
    }
  } catch (e: any) {
    tests.push({ name: 'Distance Algorithm', status: 'FAIL', message: e.message });
  }

  // 2. Test API Connection
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Ping',
    });
    if (response.text) {
        tests.push({ name: 'Gemini API Connection', status: 'PASS', message: 'Connected to Gemini 3 Flash.' });
    } else {
        tests.push({ name: 'Gemini API Connection', status: 'FAIL', message: 'No text returned.' });
    }
  } catch (e: any) {
    const msg = e.message || '';
    if (msg.includes('403') || msg.toLowerCase().includes('leaked') || msg.toLowerCase().includes('key')) {
         tests.push({ name: 'Gemini API Connection', status: 'FAIL', message: 'API Key Invalid/Leaked (403)' });
    } else {
         tests.push({ name: 'Gemini API Connection', status: 'FAIL', message: msg });
    }
  }

  // 3. Test Maps Image Verification
  try {
     const testCandidates = [{ name: "Starbucks", viralReason: "Test" }];
     const testCoords = { latitude: 40.7580, longitude: -73.9855 }; // NYC
     
     const results = await verifyWithMaps(testCandidates, testCoords);
     
     if (results.length > 0) {
         const p = results[0];
         // Check if we got a valid image URL
         const hasImage = p.imageUrl && p.imageUrl.startsWith('http');
         
         if (hasImage) {
              tests.push({ name: 'Maps Image Fetch', status: 'PASS', message: `Found image: ${p.imageUrl?.substring(0, 30)}...` });
         } else {
              tests.push({ name: 'Maps Image Fetch', status: 'FAIL', message: `Verified '${p.name}' but image URL is missing.` });
         }
     } else {
          tests.push({ name: 'Maps Image Fetch', status: 'FAIL', message: 'Verification returned no results.' });
     }
  } catch (e: any) {
     tests.push({ name: 'Maps Image Fetch', status: 'FAIL', message: e.message });
  }

  return tests;
};

// 1. DISCOVERY PHASE
export const findViralTrends = async (
  coords: Coordinates, 
  query: string,
  settings?: UserSettings
): Promise<{ candidates: Partial<ViralPlace>[], searchSources: GroundingSource[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Dynamic instructions based on connected accounts
  let platformFocus = "YouTube Shorts and Instagram Reels";
  if (settings?.connectInstagram) platformFocus = "Instagram Reels (Prioritize these)";
  if (settings?.connectYouTube) platformFocus += ", YouTube Shorts (Prioritize these)";

  const prompt = `
    I am at Latitude: ${coords.latitude}, Longitude: ${coords.longitude}.
    
    Task: Find 5-7 viral food places near me that are specifically trending on **YouTube Shorts** or **Instagram Reels**.
    
    Context: ${query ? `User craving: ${query}.` : "Look for highly viral food trends in this city/area."}
    
    Instructions:
    1. Search specifically for "YouTube Shorts food [city]" and "Instagram Reels food [city]".
    2. **STRICTLY** only return places that have a viral short-form video presence.
    3. **Video Links**: You MUST try to find a real link to a YouTube Short (youtube.com/shorts/...) or Instagram Reel (instagram.com/reel/...). 
    4. **Images**: Do not generate or hallucinate images here. We will get them from Maps later.
    5. Extract the viral reason (e.g. "cheese pull", "hidden gem"), cuisine, and popular dishes.
    
    Output JSON Schema:
    [
      {
        "name": "Social Media Name",
        "viralReason": "Reason",
        "cuisine": "Cuisine",
        "popularDishes": ["Dish1", "Dish2"],
        "sentimentSummary": "Sentiment",
        "videoLinks": [
           { "platform": "YouTube" | "Instagram", "url": "https://...", "title": "Title" }
        ]
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json'
      }
    });

    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    const groundingUrls: VideoLink[] = [];

    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ uri: chunk.web.uri, title: chunk.web.title });
          
          const lowerUri = chunk.web.uri.toLowerCase();
          
          if (lowerUri.includes('instagram.com/reel/')) {
              groundingUrls.push({ platform: 'Instagram', url: chunk.web.uri, title: 'Watch Reel' });
          } else if (lowerUri.includes('youtube.com/shorts/')) {
              groundingUrls.push({ platform: 'YouTube', url: chunk.web.uri, title: 'Watch Short' });
          }
        }
      });
    }

    const text = response.text || "[]";
    let candidates = JSON.parse(extractJson(text));
    
    candidates = candidates.map((c: any) => {
        const enrichedLinks = c.videoLinks || [];
        
        const validExistingLinks = enrichedLinks.filter((l: VideoLink) => 
            l.url.includes('/shorts/') || l.url.includes('/reel/')
        );

        groundingUrls.forEach(gUrl => {
            if (gUrl.title && c.name && (gUrl.title.toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase().includes('viral'))) {
                if (!validExistingLinks.find((el: any) => el.url === gUrl.url)) {
                    validExistingLinks.push(gUrl);
                }
            }
        });
        return { ...c, videoLinks: validExistingLinks };
    });

    return { candidates, searchSources: sources };

  } catch (error: any) {
    console.error("Error in findViralTrends:", error);
    if (error.message?.includes('403') || error.message?.includes('leaked')) {
        throw new Error("Access Denied: Your API Key has been flagged as leaked. Please generate a new key in Google AI Studio and update your environment variables.");
    }
    throw new Error("Failed to discover viral trends. Please try again.");
  }
};

// 2. VERIFICATION PHASE
export const verifyWithMaps = async (
  candidates: Partial<ViralPlace>[],
  coords: Coordinates
): Promise<ViralPlace[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  if (candidates.length === 0) return [];

  // Helper function to process a single candidate
  // This helps avoid "Rpc failed" errors caused by excessively large payloads/computations in a single request
  const verifySingleCandidate = async (candidate: Partial<ViralPlace>): Promise<ViralPlace | null> => {
    const prompt = `
        My location: ${coords.latitude}, ${coords.longitude}.
        Candidate Name: "${candidate.name}"
        Viral Context: "${candidate.viralReason || 'Trending food'}"

        Task: Verify this specific place and find a visual image.

        1. **Verification (Maps)**: 
           - Use 'googleMaps' to search for "${candidate.name}".
           - Extract: exact verified name, address, latitude, longitude, rating, userRatingCount, googleMapsUri.
           - If multiple locations exist, choose the one closest to my location.

        2. **Image Search (MANDATORY)**:
           - Use 'googleSearch' to find a high-quality photo.
           - Search query: "${candidate.name} food photo" or "${candidate.name} atmosphere".
           - Extract the most relevant 'photoUri' (must be http/https).
        
        3. **Data Merging**:
           - Combine Maps data with the Image URL.

        Return a SINGLE JSON object:
        {
            "verifiedName": "...",
            "address": "...",
            "latitude": 12.34,
            "longitude": 56.78,
            "rating": 4.5,
            "userRatingCount": 100,
            "priceLevel": "$$",
            "googleMapsUri": "https://...",
            "photoUri": "https://..."
        }
      `;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash', // Flash is faster and less prone to timeout on simple tasks
          contents: prompt,
          config: {
            tools: [{ googleMaps: {} }, { googleSearch: {} }],
            toolConfig: {
                retrievalConfig: {
                    latLng: {
                        latitude: coords.latitude,
                        longitude: coords.longitude
                    }
                }
            }
          }
        });

        const text = response.text || "{}";
        const v = JSON.parse(extractJson(text));

        // Basic verification check
        const isVerified = !!(v.verifiedName && v.latitude);

        let distanceNum = 9999;
        let distanceStr = "Unknown";
        
        if (v.latitude && v.longitude) {
             distanceNum = calculateDistance(coords.latitude, coords.longitude, v.latitude, v.longitude);
             distanceStr = `${distanceNum.toFixed(1)} km`;
        }

        // Filter by distance (20km radius limit)
        if (distanceNum > 20) return null;

        let finalImage = v.photoUri;
        // Image validation
        if (typeof finalImage !== 'string' || finalImage.length < 10 || !finalImage.startsWith('http')) {
             finalImage = undefined;
        } else {
             // Optimize Google image URLs
             if ((finalImage.includes('googleusercontent.com') || finalImage.includes('ggpht.com')) && !finalImage.includes('=')) {
                finalImage = `${finalImage}=w400-h300-k-no`;
             }
        }

        const fallbackLinks = [
            {
                platform: 'YouTube',
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent((v.verifiedName || candidate.name) + ' food shorts')}`,
                title: 'Search Shorts'
            },
            {
                platform: 'Instagram',
                url: `https://www.instagram.com/explore/tags/${encodeURIComponent((v.verifiedName || candidate.name || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase())}/`,
                title: 'Search Reels'
            }
        ];

        return {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            name: v.verifiedName || candidate.name || "Unknown Spot",
            viralReason: candidate.viralReason || "Trending locally",
            cuisine: candidate.cuisine || "Food",
            popularDishes: candidate.popularDishes || [],
            sentimentSummary: candidate.sentimentSummary || "Popular spot",
            imageUrl: finalImage,
            address: v.address,
            location: (v.latitude && v.longitude) ? { latitude: v.latitude, longitude: v.longitude } : undefined,
            rating: v.rating,
            userRatingCount: v.userRatingCount,
            priceLevel: v.priceLevel,
            distance: distanceStr,
            googleMapsUri: v.googleMapsUri,
            videoLinks: (candidate.videoLinks && candidate.videoLinks.length > 0) ? candidate.videoLinks : fallbackLinks as VideoLink[],
            sources: [],
            isVerified: isVerified
        };

      } catch (err: any) {
          console.warn(`Verification error for ${candidate.name}:`, err);
           // Propagate critical API key errors up
           if (err.message?.includes('403') || err.message?.includes('leaked')) {
             throw err;
           }

          // If we fail on one, we return a fallback object to keep the app "consistent" rather than crashing or showing nothing,
          // but we mark it as unverified.
          const fallbackLinks = [
            {
                platform: 'YouTube',
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent((candidate.name || 'food') + ' shorts')}`,
                title: 'Search Shorts'
            }
          ];

          return {
              id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
              name: candidate.name || "Unknown",
              viralReason: candidate.viralReason || "Trending",
              cuisine: candidate.cuisine || "Food",
              popularDishes: candidate.popularDishes || [],
              sentimentSummary: "Verification unavailable",
              distance: "Unknown",
              videoLinks: candidate.videoLinks || fallbackLinks as VideoLink[],
              sources: [],
              isVerified: false
          };
      }
  };

  // Execute in parallel
  const results = await Promise.all(candidates.map(c => verifySingleCandidate(c)));
  
  // Filter out explicit nulls (though logic above mostly returns fallbacks)
  return results.filter(r => r !== null) as ViralPlace[];
};
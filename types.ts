export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface VideoLink {
  platform: 'Instagram' | 'TikTok' | 'YouTube' | 'Other';
  url: string;
  title?: string;
}

export interface ViralPlace {
  id: string;
  name: string;
  viralReason: string; // Extracted from Search
  cuisine: string;
  popularDishes: string[];
  sentimentSummary: string; // Summary of comments/reviews
  
  // Maps Data
  address?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  userRatingCount?: number;
  distance?: string; // e.g., "2.5 km"
  priceLevel?: string; // e.g., "$$"
  googleMapsUri?: string;
  imageUrl?: string;
  videoLinks: VideoLink[];
  
  // Metadata
  sources: GroundingSource[];
  isVerified: boolean;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOCATING = 'LOCATING',
  SEARCHING_TRENDS = 'SEARCHING_TRENDS',
  VERIFYING_MAPS = 'VERIFYING_MAPS',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
  DIAGNOSING = 'DIAGNOSING'
}

export interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  message: string;
}

export interface UserSettings {
  connectInstagram: boolean;
  connectYouTube: boolean;
  connectTikTok: boolean;
}
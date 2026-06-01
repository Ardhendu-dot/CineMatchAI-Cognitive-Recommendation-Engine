/**
 * CineMatch AI Types
 */

export interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  genres: string[];
  director: string;
  cast: string[];
  keywords: string[];
  overview: string;
  poster: string;
  cover: string;
  popularity: number; // For analytics & trending
  runtime: number; // In minutes
  tagline?: string;
  matchScore?: number; // Calculated dynamically (e.g. similarity %)
}

export type MoodType = 'Happy' | 'Sad' | 'Motivated' | 'Excited' | 'Emotional' | 'Relaxed';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestedMovies?: string[]; // IDs of recommended movies
}

export interface RecommendationRequest {
  favoriteMovieIds?: string[];
  genreFilters?: string[];
  moodFilter?: MoodType;
  searchText?: string;
}

export interface RecommendationResponse {
  movies: Movie[];
  explanation: string;
  methodology: string;
}

export interface AnalyticsData {
  genreDistribution: { genre: string; count: number }[];
  ratingDistribution: { range: string; count: number }[];
  trendingMovies: Movie[];
  popularDirectors: { director: string; filmCount: number; avgRating: number }[];
}

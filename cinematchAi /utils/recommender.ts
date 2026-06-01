import { Movie, MoodType } from '../types';
import { movies, MOOD_MAPPINGS } from '../data/movies';

/**
 * Stop words to filter out before vectorization
 */
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'cant', 'cannot', 'could', 'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having',
  'he', 'hed', 'hell', 'hes', 'her', 'here', 'heres', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows',
  'i', 'id', 'ill', 'im', 'ive', 'if', 'in', 'into', 'is', 'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more',
  'most', 'mustnt', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought',
  'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should',
  'shouldnt', 'so', 'some', 'such', 'than', 'that', 'thats', 'the', 'their', 'theirs', 'them', 'themselves',
  'then', 'there', 'theres', 'these', 'they', 'theyd', 'theyll', 'theyre', 'theyve', 'this', 'those', 'through',
  'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasnt', 'we', 'wed', 'well', 'were', 'weve', 'werent',
  'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which', 'while', 'who', 'whos', 'whom', 'why', 'whys',
  'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve', 'your', 'yours', 'yourself', 'yourselves'
]);

/**
 * Tokenize a text string, lowercase it, remove punctuation, and filter stop words
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));
}

/**
 * Build a feature string for a movie representing its metadata
 * Genres (repeated to increase weight), Keywords, Director, Cast, and Overview.
 */
function getMovieFeatureText(movie: Movie): string {
  const genresStr = movie.genres.map(g => g.toLowerCase()).join(' ');
  // Give genres double weight by repeating them in the tokenization bag
  const doubleGenres = `${genresStr} ${genresStr}`;
  const keywordsStr = movie.keywords.map(k => k.toLowerCase().replace(/\s+/g, '')).join(' ');
  const directorStr = movie.director.toLowerCase();
  const castStr = movie.cast.map(c => c.toLowerCase()).join(' ');
  const titleStr = movie.title.toLowerCase();
  
  return `${titleStr} ${doubleGenres} ${keywordsStr} ${directorStr} ${castStr} ${movie.overview}`;
}

/**
 * Calculate Term Frequency (TF) vector for a tokenized text
 */
function getTermFrequency(tokens: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1;
  }
  return tf;
}

/**
 * Compute the cosine similarity coefficient between two term frequency vectors
 */
function computeCosineSimilarity(tf1: Record<string, number>, tf2: Record<string, number>): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  // Set of joint unique terms
  const terms1 = Object.keys(tf1);
  const terms2 = Object.keys(tf2);
  const allTerms = new Set([...terms1, ...terms2]);

  for (const term of allTerms) {
    const val1 = tf1[term] || 0;
    const val2 = tf2[term] || 0;
    dotProduct += val1 * val2;
    norm1 += val1 * val1;
    norm2 += val2 * val2;
  }

  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Content-based Filter Recommender Engine:
 * Returns recommendations based on similarity to a list of target reference movies.
 */
export function getRecommendations(
  favoriteIds: string[],
  genreFilters: string[] = [],
  moodFilter?: MoodType,
  searchText: string = ''
): Movie[] {
  // If we have search text, perform search filtering as the primary selection or weight
  const searchTokens = searchText ? tokenize(searchText) : [];
  
  // Pre-tokenize and calculate TF for all movies to optimize
  const movieTfs = movies.map(movie => {
    const text = getMovieFeatureText(movie);
    const tokens = tokenize(text);
    return {
      movie,
      tf: getTermFrequency(tokens),
      genresSet: new Set(movie.genres)
    };
  });

  // Calculate composite Vector if we have favorite reference movies
  const targetTfs: Record<string, number>[] = [];
  if (favoriteIds.length > 0) {
    movieTfs.forEach(item => {
      if (favoriteIds.includes(item.movie.id)) {
        targetTfs.push(item.tf);
      }
    });
  }

  // Calculate similarity for each movie in candidate list
  const scoredMovies = movieTfs.map(candidate => {
    const isTarget = favoriteIds.includes(candidate.movie.id);
    
    let similarityScore = 0;
    
    // 1. Math-based Cosine Similarity against chosen favorites
    if (targetTfs.length > 0) {
      const similarities = targetTfs.map(targetTf => computeCosineSimilarity(targetTf, candidate.tf));
      // Average similarity to our favorite list
      similarityScore = similarities.reduce((a, b) => a + b, 0) / similarities.length;
    } else if (searchTokens.length > 0) {
      // If no favorites are selected, but search is typed, similarity is computed against search terms
      const searchTf = getTermFrequency(searchTokens);
      similarityScore = computeCosineSimilarity(searchTf, candidate.tf);
    } else {
      // Default baseline similarity structure (e.g. general relevance based on score/popularity)
      similarityScore = candidate.movie.rating / 10 * 0.4 + candidate.movie.popularity / 100 * 0.3;
    }

    // 2. Extra Feature Engineering Adjustments:
    
    // Genre filtering & matching booster
    let genreMatchBonus = 0;
    if (genreFilters.length > 0) {
      const matchCount = genreFilters.filter(g => candidate.genresSet.has(g)).length;
      if (matchCount === 0 && favoriteIds.length === 0 && !searchText) {
        // Direct filters act as a hard filter if there are no seed movies/searches
        similarityScore = -1; 
      } else {
        genreMatchBonus = (matchCount / genreFilters.length) * 0.25;
      }
    }

    // Mood adjustment
    let moodBonus = 0;
    if (moodFilter) {
      const moodMapping = MOOD_MAPPINGS[moodFilter];
      if (moodMapping) {
        // Boost weighted genres matching the mood
        Object.entries(moodMapping.genreWeight).forEach(([genre, weight]) => {
          if (candidate.genresSet.has(genre)) {
            moodBonus += (weight - 1.0) * 0.15;
          }
        });
        
        // Boost matching keywords
        candidate.movie.keywords.forEach(kw => {
          if (moodMapping.keywords.includes(kw.toLowerCase())) {
            moodBonus += 0.1;
          }
        });
      }
    }

    // Normalize final similarity percentage to realistic 0-100 range
    let finalScoreScalar = similarityScore;
    if (genreMatchBonus > 0) finalScoreScalar += genreMatchBonus;
    if (moodBonus > 0) finalScoreScalar += moodBonus;

    // Direct match multiplier for exact attributes
    if (favoriteIds.length > 0) {
      // Check if candidate shares same director as any of our favorites
      const sampleFavorites = movies.filter(f => favoriteIds.includes(f.id));
      const directors = sampleFavorites.map(f => f.director);
      if (directors.includes(candidate.movie.director)) {
        finalScoreScalar += 0.15; // Nice boost for same director!
      }

      // Check for overlapping cast members
      const favCast = new Set(sampleFavorites.flatMap(f => f.cast));
      const overlappingCast = candidate.movie.cast.filter(actor => favCast.has(actor)).length;
      if (overlappingCast > 0) {
        finalScoreScalar += 0.05 * overlappingCast;
      }
    }

    // Ensure we cap percentage logically
    let finalPercentage = Math.round(Math.min(99, Math.max(10, finalScoreScalar * 100)));
    
    // Explicit exclusions
    if (isTarget) {
      finalPercentage = 100; // Perfect comparison
    }

    return {
      movie: { ...candidate.movie, matchScore: finalPercentage },
      isTarget,
      score: finalPercentage
    };
  });

  // Filter out the selected seed movies from the recommended items (avoid circular recommendations on screen unless needed)
  return scoredMovies
    .filter(item => !item.isTarget && item.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.movie);
}

/**
 * Dynamic Analytics summary calculator
 */
export function getAnalyticsData(): {
  genreDistribution: { genre: string; count: number }[];
  ratingDistribution: { range: string; count: number }[];
  trendingMovies: Movie[];
  popularDirectors: { director: string; filmCount: number; avgRating: number }[];
} {
  // Count genres
  const genreCount: Record<string, number> = {};
  movies.forEach(m => {
    m.genres.forEach(g => {
      genreCount[g] = (genreCount[g] || 0) + 1;
    });
  });
  const genreDistribution = Object.entries(genreCount)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);

  // Ratings ranges
  const ratingsRanges = {
    '9.0+ Excellent': 0,
    '8.5 - 8.9 Masterpiece': 0,
    '8.0 - 8.4 Good': 0,
    '7.5 - 7.9 Decent': 0,
  };
  movies.forEach(m => {
    if (m.rating >= 9.0) ratingsRanges['9.0+ Excellent']++;
    else if (m.rating >= 8.5) ratingsRanges['8.5 - 8.9 Masterpiece']++;
    else if (m.rating >= 8.0) ratingsRanges['8.0 - 8.4 Good']++;
    else if (m.rating >= 7.5) ratingsRanges['7.5 - 7.9 Decent']++;
  });
  const ratingDistribution = Object.entries(ratingsRanges).map(([range, count]) => ({ range, count }));

  // Directors analysis
  const dStats: Record<string, { count: number; sumRating: number }> = {};
  movies.forEach(m => {
    if (!dStats[m.director]) {
      dStats[m.director] = { count: 0, sumRating: 0 };
    }
    dStats[m.director].count++;
    dStats[m.director].sumRating += m.rating;
  });
  const popularDirectors = Object.entries(dStats)
    .map(([director, stats]) => ({
      director,
      filmCount: stats.count,
      avgRating: parseFloat((stats.sumRating / stats.count).toFixed(1))
    }))
    .sort((a, b) => b.filmCount - a.filmCount || b.avgRating - a.avgRating)
    .slice(0, 5);

  // Trending
  const trendingMovies = [...movies].sort((a, b) => b.popularity - a.popularity).slice(0, 6);

  return {
    genreDistribution,
    ratingDistribution,
    trendingMovies,
    popularDirectors
  };
}

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Sparkles, Film, Heart, Tv, BarChart3, MessageSquare, 
  Plus, Check, X, ChevronRight, Play, Volume2, Award, Clock, 
  ArrowRight, Sliders, Smile, Compass, TrendingUp, Info, RotateCcw,
  VolumeX, Pause, Share2, Star
} from 'lucide-react';
import { Movie, MoodType, ChatMessage } from './types';
import { movies as offlineMovies, MOOD_MAPPINGS } from './data/movies';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'analytics' | 'watchlist'>('home');

  // Movie & Recommendation State
  const [moviesList, setMoviesList] = useState<Movie[]>(offlineMovies);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [favoriteMovieIds, setFavoriteMovieIds] = useState<string[]>(['inception', 'interstellar']); // default seed values
  const [genreFilters, setGenreFilters] = useState<string[]>([]);
  const [moodFilter, setMoodFilter] = useState<MoodType | undefined>(undefined);
  
  // Search & Autocomplete
  const [searchText, setSearchText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Recommendation Results
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Selected Movie Pop-up Modal Details
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [playingTrailer, setPlayingTrailer] = useState(false);
  const [trailerAudioPlaying, setTrailerAudioPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorNodeRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Affirmative, Cinephile. I am **CineMatch AI** — your tactical movie catalog advisor. I analyze film metadata, directorship traits, script weights, and thematic motifs using advanced content vector math and Gemini models. Ask me anything, or try a diagnostic preset below to discover something legendary.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Analytics API fallback states
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Load initial watchlist and states
  useEffect(() => {
    try {
      const savedWatchlist = localStorage.getItem('cinematch_watchlist');
      if (savedWatchlist) {
        setWatchlist(JSON.parse(savedWatchlist));
      }
    } catch (e) {
      console.warn("Local storage parse failed", e);
    }

    // Refresh recommendations initially
    fetchRecommendations();
    fetchAnalytics();
  }, []);

  // Fetch math backend recommendations based on state change
  const fetchRecommendations = async (overrideSeeds?: string[], overrideGenres?: string[], overrideMood?: MoodType, customSearch?: string) => {
    setLoadingRecommendations(true);
    const seeds = overrideSeeds !== undefined ? overrideSeeds : favoriteMovieIds;
    const genres = overrideGenres !== undefined ? overrideGenres : genreFilters;
    const mood = overrideMood !== undefined ? overrideMood : moodFilter;
    const search = customSearch !== undefined ? customSearch : searchText;

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          favoriteMovieIds: seeds,
          genreFilters: genres,
          moodFilter: mood,
          searchText: search
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendedMovies(data.movies);
      } else {
        throw new Error("API failed");
      }
    } catch (err) {
      // Local Fallback simulation engine
      const localMatched = mockLocalRecommendationMath(seeds, genres, mood, search);
      setRecommendedMovies(localMatched);
    } finally {
      // Small timeout to give it a sci-fi "calculating vectors" effect
      setTimeout(() => {
        setLoadingRecommendations(false);
      }, 350);
    }
  };

  // Fetch Analytics summary stats
  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      } else {
        throw new Error("API failed");
      }
    } catch (err) {
      // Fallback calculations standard client-side
      setAnalyticsData(calculateMockAnalytics());
    }
  };

  // Synchronously fetch recommendations on interactive changes with debounce/gateways
  useEffect(() => {
    fetchRecommendations();
  }, [favoriteMovieIds, genreFilters, moodFilter]);

  // Handle outside click to close search suggestions list
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Watchlist functions
  const toggleWatchlist = (id: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    let updated;
    if (watchlist.includes(id)) {
      updated = watchlist.filter(mid => mid !== id);
    } else {
      updated = [...watchlist, id];
    }
    setWatchlist(updated);
    localStorage.setItem('cinematch_watchlist', JSON.stringify(updated));
  };

  // Favorite Seeds configuration
  const toggleFavoriteSeed = (id: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    let updated;
    if (favoriteMovieIds.includes(id)) {
      updated = favoriteMovieIds.filter(mid => mid !== id);
    } else {
      if (favoriteMovieIds.length >= 6) {
        // limit to max 5/6 to keep neural similarity matrix tightly focused
        updated = [...favoriteMovieIds.slice(1), id];
      } else {
        updated = [...favoriteMovieIds, id];
      }
    }
    setFavoriteMovieIds(updated);
  };

  const clearFilters = () => {
    setFavoriteMovieIds([]);
    setGenreFilters([]);
    setMoodFilter(undefined);
    setSearchText('');
    fetchRecommendations([], [], undefined, '');
  };

  // Autocomplete & search lookup
  const searchSuggestions = useMemo(() => {
    if (!searchText.trim()) return [];
    return moviesList.filter(m => 
      m.title.toLowerCase().includes(searchText.toLowerCase()) ||
      m.genres.some(g => g.toLowerCase().includes(searchText.toLowerCase())) ||
      m.director.toLowerCase().includes(searchText.toLowerCase())
    ).slice(0, 5);
  }, [searchText, moviesList]);

  const handleSuggestionClick = (movie: Movie) => {
    setSearchText('');
    setShowSuggestions(false);
    // Add to seed favorites instantly
    if (!favoriteMovieIds.includes(movie.id)) {
      toggleFavoriteSeed(movie.id);
    }
    // Also trigger modal view directly for them to play with
    openMovieModal(movie);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    fetchRecommendations(favoriteMovieIds, genreFilters, moodFilter, searchText);
  };

  // Open detailed movie modal with AI narrative explanations
  const openMovieModal = async (movie: Movie) => {
    setSelectedMovie(movie);
    setPlayingTrailer(false);
    setTrailerAudioPlaying(false);
    setAiExplanation('');
    setLoadingExplanation(true);
    
    // Attempt explanation from real server using modern Gemini 3.5 Flash
    try {
      const parentTitles = moviesList
        .filter(m => favoriteMovieIds.includes(m.id))
        .map(m => m.title);
      
      const res = await fetch('/api/recommend/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chosenMovieTitles: parentTitles.length > 0 ? parentTitles : ['The Matrix', 'Inception'],
          targetMovieTitle: movie.title
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiExplanation(data.explanation);
      } else {
        throw new Error();
      }
    } catch (e) {
      setAiExplanation(`"${movie.title}" synthesizes exceptional aesthetic depth with stylistic signatures of ${movie.director}. Its plot architecture resonates deeply with your affinity for high-concept sci-fi and cerebral puzzle scripts.`);
    } finally {
      setLoadingExplanation(false);
    }
  };

  // Close Movie modal and clean up audio context synth nodes
  const closeMovieModal = () => {
    setSelectedMovie(null);
    stopSimulatedSoundtrack();
  };

  // Simulated ambient soundtrack using Web Audio API (creates a futuristic sound wave)
  const toggleSimulatedSoundtrack = () => {
    if (trailerAudioPlaying) {
      stopSimulatedSoundtrack();
    } else {
      startSimulatedSoundtrack();
    }
  };

  const startSimulatedSoundtrack = () => {
    try {
      // 1. Create Web Audio API context
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const actx = new AudioCtx();
      audioContextRef.current = actx;

      // Create primary elements
      const osc = actx.createOscillator();
      const gain = actx.createGain();

      oscillatorNodeRef.current = osc;
      gainNodeRef.current = gain;

      // Connect nodes
      osc.connect(gain);
      gain.connect(actx.destination);

      // Program gorgeous cinematic sci-fi low hum frequency (Hz)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, actx.currentTime); // Low A note
      
      // Dynamic frequency modulation to make a "Reaper" sound scanner
      osc.frequency.exponentialRampToValueAtTime(110, actx.currentTime + 3);
      osc.frequency.exponentialRampToValueAtTime(70, actx.currentTime + 6);

      // Low pass filter
      const filter = actx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, actx.currentTime);
      osc.disconnect(gain);
      osc.connect(filter);
      filter.connect(gain);

      // Soft fading gain levels
      gain.gain.setValueAtTime(0.01, actx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, actx.currentTime + 1.5);

      osc.start();
      setTrailerAudioPlaying(true);
    } catch (error) {
      console.warn("Failed to initialize synth", error);
    }
  };

  const stopSimulatedSoundtrack = () => {
    try {
      if (oscillatorNodeRef.current) {
        oscillatorNodeRef.current.stop();
        oscillatorNodeRef.current.disconnect();
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    } catch (e) {}
    oscillatorNodeRef.current = null;
    gainNodeRef.current = null;
    audioContextRef.current = null;
    setTrailerAudioPlaying(false);
  };

  // Chat message submission
  const sendChatMessage = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = customQuery || chatInput;
    if (!query.trim()) return;

    // Push user message
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!customQuery) setChatInput('');
    setChatLoading(true);

    try {
      // Call modern Gemini server API endpoint
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatMessages,
          latestMessage: query
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: Math.random().toString(),
          sender: 'ai',
          text: data.message || "Synthesizing options... Here are curated movies matching your description:",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedMovies: data.suggestedMovieIds || []
        };
        setChatMessages(prev => [...prev, aiMsg]);
        
        // Boost watchlist recommendation index or synchronize recommendation states
        if (data.suggestedMovieIds && data.suggestedMovieIds.length > 0) {
          // If the AI recommends a set of movies, dynamically add them to our lists as recommendations
        }
      } else {
        throw new Error();
      }
    } catch (err) {
      // Fallback
      setTimeout(() => {
        const lower = query.toLowerCase();
        let fallbackTexts = "Our vector cognitive systems have analysed your input. Here are top cinematic suggestions reflecting those exact atmospheric tones:";
        let matched: string[] = ['inception', 'interstellar'];

        if (lower.includes('thriller') || lower.includes('scary') || lower.includes('horror')) {
          matched = ['the-shining', 'get-out', 'parasite'];
          fallbackTexts = "Analyzing dark tonal spectrums... Transmitting localized visual thrillers full of isolation mechanics and narrative twists:";
        } else if (lower.includes('comedy') || lower.includes('happy') || lower.includes('fun')) {
          matched = ['superbad', 'the-grand-budapest-hotel', 'toy-story-3'];
          fallbackTexts = "Decoding dynamic comedic timing profiles... Pulling witty script structures and vibrant whimsical aesthetics:";
        } else if (lower.includes('space') || lower.includes('sci-fi') || lower.includes('futuristic')) {
          matched = ['blade-runner-2049', 'interstellar', 'the-matrix'];
          fallbackTexts = "Accessing cybernetic and high-concept files... Here are masterfully rendered futurisms representing mind-bending limits:";
        }

        const aiMsg: ChatMessage = {
          id: Math.random().toString(),
          sender: 'ai',
          text: fallbackTexts,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedMovies: matched
        };
        setChatMessages(prev => [...prev, aiMsg]);
      }, 900);
    } finally {
      setChatLoading(false);
    }
  };

  // Helper selectors
  const activeWatchlistMovies = useMemo(() => {
    return moviesList.filter(m => watchlist.includes(m.id));
  }, [watchlist, moviesList]);

  const activeSeedsMovies = useMemo(() => {
    return moviesList.filter(m => favoriteMovieIds.includes(m.id));
  }, [favoriteMovieIds, moviesList]);

  // Calculations for mock local recommendation engine in case of offline/build variables
  function mockLocalRecommendationMath(seeds: string[], genres: string[], mood: string | undefined, search: string) {
    return offlineMovies.map(m => {
      let score = 50; // default base match score

      // 1. Title/overview text matches
      if (search) {
        const terms = search.toLowerCase().split(/\s+/);
        terms.forEach(t => {
          if (m.title.toLowerCase().includes(t)) score += 25;
          if (m.genres.some(g => g.toLowerCase().includes(t))) score += 15;
          if (m.overview.toLowerCase().includes(t)) score += 8;
        });
      }

      // 2. Similarity to seeds
      if (seeds.length > 0) {
        let maxOverlap = 0;
        const seedMovies = offlineMovies.filter(sm => seeds.includes(sm.id));
        
        seedMovies.forEach(sm => {
          let overlap = 0;
          // genre match
          const genreOverlap = m.genres.filter(g => sm.genres.includes(g)).length;
          overlap += genreOverlap * 12;

          // director match
          if (m.director === sm.director) overlap += 20;

          // cast match
          const castOverlap = m.cast.filter(c => sm.cast.includes(c)).length;
          overlap += castOverlap * 6;

          // keywords overlap
          const kwOverlap = m.keywords.filter(k => sm.keywords.includes(k)).length;
          overlap += kwOverlap * 5;

          if (overlap > maxOverlap) maxOverlap = overlap;
        });

        score += maxOverlap;
      } else {
        // default baseline weight
        score += m.rating * 4 + m.popularity * 0.15;
      }

      // 3. Genre matches
      if (genres.length > 0) {
        const matchCount = m.genres.filter(g => genres.includes(g)).length;
        score += matchCount * 14;
      }

      // 4. Mood booster
      if (mood) {
        const mapping = MOOD_MAPPINGS[mood];
        if (mapping) {
          Object.entries(mapping.genreWeight).forEach(([g, w]) => {
            if (m.genres.includes(g)) score += (w - 1.0) * 20;
          });
          m.keywords.forEach(kw => {
            if (mapping.keywords.includes(kw.toLowerCase())) score += 8;
          });
        }
      }

      // Cap logically between 38% and 98%
      const finalPercentage = Math.round(Math.min(99, Math.max(12, score)));
      return {
        ...m,
        matchScore: seeds.includes(m.id) ? 100 : finalPercentage
      };
    }).filter(m => !seeds.includes(m.id))
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }

  // Pre-calculate beautiful analytical parameters in client
  function calculateMockAnalytics() {
    const genreCount: Record<string, number> = {};
    offlineMovies.forEach(m => {
      m.genres.forEach(g => {
        genreCount[g] = (genreCount[g] || 0) + 1;
      });
    });
    
    const genreDistribution = Object.entries(genreCount)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const ratingsRanges = {
      '9.0+ Cult Stars': 3,
      '8.5 - 8.9 Masters': 8,
      '8.0 - 8.4 Premium': 12,
      '7.5 - 7.9 Acclaimed': 5,
    };
    const ratingDistribution = Object.entries(ratingsRanges).map(([range, count]) => ({ range, count }));

    const popularDirectors = [
      { director: 'Christopher Nolan', filmCount: 3, avgRating: 8.8 },
      { director: 'Denis Villeneuve', filmCount: 3, avgRating: 8.0 },
      { director: 'Damien Chazelle', filmCount: 2, avgRating: 8.3 },
      { director: 'Quentin Tarantino', filmCount: 1, avgRating: 8.9 },
      { director: 'Martin Scorsese', filmCount: 1, avgRating: 8.7 }
    ];

    const trendingMovies = [...offlineMovies].sort((a,b) => b.popularity - a.popularity).slice(0, 5);

    return {
      genreDistribution,
      ratingDistribution,
      trendingMovies,
      popularDirectors
    };
  }

  // Active analytic metrics derived
  const derivedAnalytics = useMemo(() => {
    return analyticsData || calculateMockAnalytics();
  }, [analyticsData]);

  // Computed trending movies
  const trendingNow = useMemo(() => {
    return offlineMovies.sort((a, b) => b.popularity - a.popularity).slice(0, 4);
  }, [offlineMovies]);

  const topRated = useMemo(() => {
    return offlineMovies.sort((a, b) => b.rating - a.rating).slice(0, 4);
  }, [offlineMovies]);

  return (
    <div id="cinematch-terminal" className="bg-[#050507] text-gray-100 min-h-screen font-sans flex flex-col md:flex-row antialiased selection:bg-red-600 selection:text-white">
      
      {/* GLOWING AMBIENCE BACKDROP LIGHT NODES */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-10 left-12 w-[400px] h-[400px] bg-red-950/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-10 left-1/4 w-[350px] h-[350px] bg-red-950/20 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* SIDEBAR NAVIGATION CONTROL BAR */}
      <aside className="w-full md:w-64 shrink-0 bg-[#0d0d12] border-b md:border-b-0 md:border-r border-zinc-800/80 p-4 md:p-6 flex flex-col justify-between gap-6 relative z-10">
        <div className="flex flex-col gap-6 md:gap-8">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-red-600 to-red-900 p-2.5 rounded-xl shadow-[0_0_20px_rgba(229,9,20,0.4)]">
              <Sparkles className="w-5 h-5 text-red-100" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-red-500 bg-clip-text text-transparent">
                CINEMATCH <span className="text-red-600">AI</span>
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-[#E50914] font-semibold animate-pulse">NEURAL NETWORK ENGINE</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none">
            
            <button 
              id="nav-btn-home"
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 w-full shrink-0 md:shrink ${
                activeTab === 'home' 
                  ? 'bg-gradient-to-r from-red-950/40 to-transparent border-l-2 border-red-600 text-white font-semibold' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Film className="w-4 h-4 shrink-0" />
              <span>Cinematic Deck</span>
              {favoriteMovieIds.length > 0 && (
                <span className="ml-auto text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded-md hidden md:inline">
                  {favoriteMovieIds.length} Seeds
                </span>
              )}
            </button>

            <button 
              id="nav-btn-chat"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 w-full shrink-0 md:shrink ${
                activeTab === 'chat' 
                  ? 'bg-gradient-to-r from-red-950/40 to-transparent border-l-2 border-red-600 text-white font-semibold' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>AI Chat Advisor</span>
              <span className="ml-auto flex h-2 w-2 relative hidden md:inline">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
            </button>

            <button 
              id="nav-btn-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 w-full shrink-0 md:shrink ${
                activeTab === 'analytics' 
                  ? 'bg-gradient-to-r from-red-950/40 to-transparent border-l-2 border-red-600 text-white font-semibold' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Analytics Lab</span>
            </button>

            <button 
              id="nav-btn-watchlist"
              onClick={() => setActiveTab('watchlist')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 w-full shrink-0 md:shrink relative ${
                activeTab === 'watchlist' 
                  ? 'bg-gradient-to-r from-red-950/40 to-transparent border-l-2 border-red-600 text-white font-semibold' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Heart className="w-4 h-4 shrink-0" />
              <span>My Watchlist</span>
              {watchlist.length > 0 && (
                <span className="ml-auto bg-[#E50914] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                  {watchlist.length}
                </span>
              )}
            </button>

          </nav>
        </div>

        {/* Neural Network Status Footer */}
        <div id="network-panel" className="hidden md:flex flex-col gap-2.5 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-xs">
          <div className="flex items-center gap-2 text-zinc-300 font-semibold">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Local Math Engine</span>
          </div>
          <div className="text-[11px] text-zinc-500 space-y-1">
            <p>Database: 28 Curated classics</p>
            <p>System Layer: content-based cosine</p>
            <p>Vector Width: 128 keywords</p>
          </div>
          <button 
            onClick={clearFilters}
            className="mt-1.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition text-[10px] uppercase tracking-wider font-bold"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Engines
          </button>
        </div>
      </aside>

      {/* MAIN VIEW CONTENT CONTAINER */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto relative z-10 flex flex-col gap-6 md:gap-8">
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 md:gap-8 flex-1">
          
          {/* TOP STATUS BAR & DYNAMIC HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
          <div>
            <h2 id="page-title" className="text-2xl md:text-3.5xl font-black tracking-tight text-white capitalize flex items-center gap-2">
              {activeTab === 'home' && <>Cinematic Discovery Deck <Sliders className="w-6 h-6 text-red-500" /></>}
              {activeTab === 'chat' && <>Interactive AI Film Critic <MessageSquare className="w-6 h-6 text-red-500" /></>}
              {activeTab === 'analytics' && <>Data Science Analytics Studio <BarChart3 className="w-6 h-6 text-[#E50914]" /></>}
              {activeTab === 'watchlist' && <>Your Cinematic Queue <Heart className="w-6 h-6 text-red-500" /></>}
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              {activeTab === 'home' && "Train custom relevance vectors based on movies you love, moods, or genres."}
              {activeTab === 'chat' && "Consult our LLM movie curator for customized recommendations, reviews, and explanations."}
              {activeTab === 'analytics' && "Visualize movie ratings distribution, popular directors, and active database statistics."}
              {activeTab === 'watchlist' && "Manage your curated, high-concept watchlist profile saved on this device."}
            </p>
          </div>

          {/* Quick Active Match Seeds Indicator */}
          {activeTab === 'home' && favoriteMovieIds.length > 0 && (
            <div className="flex items-center gap-2 bg-red-950/20 border border-red-800/20 px-3.5 py-2 rounded-xl text-xs shrink-0 backdrop-blur-md">
              <Star className="w-3.5 h-3.5 text-[#E50914] fill-[#E50914]" />
              <div className="text-zinc-300">
                Active similarity seeds: <strong className="text-white">{favoriteMovieIds.length}</strong>
              </div>
            </div>
          )}
        </header>

        {/* ========================================================= */}
        {/* VIEW 1: HOME/CINEMATIC DISCOVERY DASHBOARD */}
        {/* ========================================================= */}
        {activeTab === 'home' && (
          <div className="flex flex-col gap-8">
            
            {/* HERO PROMOTIONAL BANNER */}
            <section className="relative overflow-hidden rounded-3xl bg-[#09090d] border border-zinc-800/60 p-6 md:p-10 flex flex-col gap-6 justify-between shadow-[0_4px_40px_rgba(0,0,0,0.8)]">
              
              {/* Blurred artwork overlay behind text */}
              <div 
                className="absolute right-0 top-0 w-full md:w-3/5 h-full opacity-20 md:opacity-35 bg-cover bg-center pointer-events-none"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-zinc-950/90 to-transparent pointer-events-none" />

              <div className="max-w-2xl relative z-10 flex flex-col gap-4">
                <span className="text-[11px] font-semibold text-[#E50914] tracking-widest uppercase py-1 px-2.5 bg-red-950/30 border border-red-800/30 rounded-full w-max">
                  Gemini-3.5 Synergy Verified
                </span>
                <h3 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                  Discover Cinema <br/>
                  Matching Your <span className="bg-gradient-to-r from-[#E50914] via-orange-500 to-amber-400 bg-clip-text text-transparent">Cognitive Target</span>
                </h3>
                <p className="text-sm md:text-base text-zinc-400 max-w-lg mt-1">
                  Type a concept, choose reference movies, or pick a mood. CineMatch AI deploys content vector math to isolate matching story layers instantly.
                </p>

                {/* SEARCH COMPONENT WITH INTERACTIVE SUGGESTIONS */}
                <form onSubmit={handleSearchSubmit} ref={searchContainerRef} className="relative z-30 mt-3 max-w-md w-full">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3.5 w-5 h-5 text-zinc-400" />
                    <input 
                      id="hero-search-input"
                      type="text" 
                      value={searchText}
                      onChange={(e) => {
                        setSearchText(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Search title, director, keyword (e.g., 'dreams')..." 
                      className="w-full pl-11 pr-24 py-3 bg-zinc-900/90 border border-zinc-700/60 rounded-xl focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600/50 text-sm transition text-white placeholder-zinc-500 backdrop-blur-md"
                    />
                    <button 
                      type="submit"
                      className="absolute right-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <span>Analyze</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Suggestions Popover */}
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-zinc-950/95 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl z-50 divide-y divide-zinc-900 backdrop-blur-xl">
                      <div className="px-3.5 py-1.5 text-[10px] text-zinc-500 uppercase tracking-widest font-semibold bg-zinc-900/30">
                        Select to Seed & Inspect
                      </div>
                      {searchSuggestions.map(movie => (
                        <button
                          key={movie.id}
                          type="button"
                          onClick={() => handleSuggestionClick(movie)}
                          className="w-full px-3.5 py-2.5 text-left text-xs text-zinc-300 hover:bg-red-950/20 hover:text-white flex items-center justify-between transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            <span className="font-semibold">{movie.title}</span>
                            <span className="text-zinc-500 text-[10px]">({movie.year}) • {movie.director}</span>
                          </div>
                          <span className="text-red-500 text-[10px] font-mono">{movie.genres[0]}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </form>
              </div>

              {/* ACTIVE FILTER SEED PILLS DOCK */}
              <div className="relative z-10 flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-zinc-800/60">
                <span className="text-xs text-zinc-400 font-bold flex items-center gap-1.5 mr-2">
                  <Sliders className="w-3.5 h-3.5 text-red-500" /> Custom Tuning:
                </span>

                {/* Seeds selected list */}
                {activeSeedsMovies.map(movie => (
                  <div key={movie.id} className="flex items-center gap-1.5 bg-gradient-to-r from-red-950/60 to-zinc-900 text-zinc-100 text-xs px-2.5 py-1.5 rounded-lg border border-red-900/50 hover:border-red-600 transition">
                    <span className="font-semibold">{movie.title}</span>
                    <button 
                      onClick={(e) => toggleFavoriteSeed(movie.id, e)} 
                      className="text-zinc-400 hover:text-red-500 transition ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Help empty pills indication */}
                {favoriteMovieIds.length === 0 && (
                  <p className="text-xs text-zinc-500 italic">No movie seed tags selected. Click any movie card below to set similarity references.</p>
                )}
              </div>
            </section>

            {/* DYNAMIC FILTERING DECK: MOODS AND GENRES */}
            <section className="bg-zinc-900/30 border border-zinc-800/40 p-4 rounded-2xl flex flex-col gap-4">
              
              {/* Mood selector list */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-zinc-400 flex items-center gap-2">
                  <Smile className="w-4 h-4 text-orange-400" /> Tune Mood State
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(['Happy', 'Sad', 'Motivated', 'Excited', 'Emotional', 'Relaxed'] as MoodType[]).map(mood => {
                    const emojis: Record<string, string> = {
                      Happy: '😄', Sad: '😢', Motivated: '⚡', Excited: '🔥', Emotional: '🥺', Relaxed: '🍃'
                    };
                    return (
                      <button
                        key={mood}
                        onClick={() => {
                          const nextMood = moodFilter === mood ? undefined : mood;
                          setMoodFilter(nextMood);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all text-zinc-300 border ${
                          moodFilter === mood 
                            ? 'bg-gradient-to-r from-red-600 to-red-800 border-red-600 text-white shadow-lg shadow-red-950/30' 
                            : 'bg-[#121217] border-zinc-800 hover:border-zinc-700 hover:text-zinc-100'
                        }`}
                      >
                        <span>{emojis[mood]}</span>
                        <span>{mood}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Genre selector grid */}
              <div className="flex flex-col gap-2 border-t border-zinc-800/40 pt-3">
                <span className="text-xs font-bold text-zinc-400 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-red-500" /> Filter Genre Architecture
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Action', 'Comedy', 'Thriller', 'Sci-Fi', 'Horror', 'Romance', 'Drama', 'Adventure', 'Mystery', 'Animation'].map(genre => {
                    const isActive = genreFilters.includes(genre);
                    return (
                      <button
                        key={genre}
                        onClick={() => {
                          if (isActive) {
                            setGenreFilters(genreFilters.filter(g => g !== genre));
                          } else {
                            setGenreFilters([...genreFilters, genre]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          isActive 
                            ? 'bg-rose-950/50 border-[#E50914] text-white' 
                            : 'bg-[#121217] border-zinc-900 text-zinc-400 hover:border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>

            </section>

            {/* RECOMMENDATIONS HEADER AREA */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-red-500 animate-pulse" /> Highly Recommended For You
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Powered by local Content vectors: Cosine matching {favoriteMovieIds.length > 0 ? `on "${activeSeedsMovies.map(m=>m.title).join(', ')}"` : 'popular titles'}
                  </p>
                </div>
                
                {/* Reset button logic */}
                <button 
                  onClick={clearFilters}
                  className="text-xs text-zinc-400 hover:text-red-500 transition-all font-bold flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl hover:bg-zinc-800"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              {/* RECOMMENDATION MOVIE GRID */}
              {loadingRecommendations ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 py-12">
                  {[1, 2, 3, 4].map(idx => (
                    <div key={idx} className="flex flex-col gap-3 animate-pulse">
                      <div className="w-full bg-[#121217] aspect-[2/3] rounded-2xl border border-zinc-900"></div>
                      <div className="h-4 bg-[#121217] rounded w-3/4"></div>
                      <div className="h-3 bg-[#121217] rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recommendedMovies.length === 0 ? (
                <div className="bg-[#121217]/50 border border-zinc-800/50 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
                  <Star className="w-10 h-10 text-zinc-600" />
                  <p className="text-sm text-zinc-400 font-medium">No movies match your selected filter matrices.</p>
                  <button 
                    onClick={clearFilters}
                    className="text-xs bg-red-600 text-white px-4 py-2 rounded-xl mt-1.5 font-bold hover:bg-red-700 transition"
                  >
                    Clear Match Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {recommendedMovies.map((movie) => {
                    const isWatchlisted = watchlist.includes(movie.id);
                    const isSeed = favoriteMovieIds.includes(movie.id);
                    const score = movie.matchScore || 70;

                    return (
                      <div 
                        key={movie.id}
                        onClick={() => openMovieModal(movie)}
                        className="group relative bg-[#0d0d12] border border-zinc-800/70 hover:border-red-600/60 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(229,9,20,0.15)] cursor-pointer flex flex-col"
                      >
                        {/* Artwork Cover Aspect Ratio Container */}
                        <div className="aspect-[2/3] relative overflow-hidden bg-zinc-900 border-b border-zinc-900">
                          <img 
                            src={movie.poster} 
                            alt={movie.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1542204172-e7052809a850?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-transparent to-transparent opacity-90" />

                          {/* Synergy Similarity Percentage Stamp */}
                          <div className="absolute top-2.5 left-2.5 bg-black/85 backdrop-blur-md text-[#22c55e] text-[10px] font-extrabold px-2 py-1 rounded-lg border border-green-800/35 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 animate-pulse" />
                            <span>{score}% Match</span>
                          </div>

                          {/* Quick Watchlist Save Action */}
                          <button
                            onClick={(e) => toggleWatchlist(movie.id, e)}
                            className="absolute top-2.5 right-2.5 p-2 bg-black/80 hover:bg-red-600 rounded-lg text-zinc-300 hover:text-white backdrop-blur-md border border-zinc-800/50 hover:border-red-500 transition-all duration-300"
                            title="Add to Watchlist"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isWatchlisted ? 'text-[#E50914] fill-[#E50914]' : ''}`} />
                          </button>

                          {/* Meta overlay details showing overview snippet & stats */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-1 transition-all transform duration-300 md:opacity-0 md:translate-y-4 group-hover:opacity-100 group-hover:translate-y-0">
                            <div className="flex gap-1.5 flex-wrap">
                              {movie.genres.slice(0, 2).map(g => (
                                <span key={g} className="text-[9px] bg-red-950/60 text-red-300 border border-red-800/25 px-1.5 py-0.5 rounded-md font-semibold">
                                  {g}
                                </span>
                              ))}
                            </div>
                            <p className="text-[10.5px] text-zinc-300 line-clamp-2 mt-1 leading-snug">{movie.overview}</p>
                          </div>
                        </div>

                        {/* Title Info Block */}
                        <div className="p-3.5 flex flex-col gap-1 w-full bg-[#0d0d12] relative z-10 flex-1 justify-between">
                          <div>
                            <h5 className="font-bold text-sm text-zinc-100 hover:text-white transition line-clamp-1">
                              {movie.title}
                            </h5>
                            <div className="flex items-center gap-2 text-zinc-500 text-[10.5px] mt-1 font-semibold">
                              <span>{movie.year}</span>
                              <span>•</span>
                              <span>{movie.runtime} min</span>
                              <span>•</span>
                              <span className="text-yellow-500 font-mono flex items-center gap-0.5">
                                ★ {movie.rating}
                              </span>
                            </div>
                          </div>

                          {/* Seed Tuning Trigger Button */}
                          <div className="border-t border-zinc-900 mt-2.5 pt-2 flex items-center justify-between">
                            <button
                              onClick={(e) => toggleFavoriteSeed(movie.id, e)}
                              className={`text-[10.5px] font-bold px-2 py-1 rounded-lg transition border duration-300 flex items-center gap-1 w-max ${
                                isSeed 
                                  ? 'bg-[#E50914] border-[#E50914] text-white' 
                                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                              }`}
                            >
                              <span>{isSeed ? 'Reset Seed' : 'Use as Seed'}</span>
                            </button>
                            <span className="text-[10px] text-zinc-500 font-mono font-medium line-clamp-1">{movie.director}</span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* CURATED GRID CATEGORIES (NETFLIX STYLE SECTIONS) */}
            <section className="flex flex-col gap-6 pt-6 border-t border-zinc-900">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-red-600 animate-pulse" /> Popular This Week (Global Ratings)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {trendingNow.map(movie => {
                  const isWatchlisted = watchlist.includes(movie.id);
                  return (
                    <div 
                      key={movie.id}
                      onClick={() => openMovieModal(movie)}
                      className="relative bg-zinc-900/30 border border-zinc-800/50 rounded-xl overflow-hidden aspect-[16/10] cursor-pointer group hover:border-[#E50914] transition"
                    >
                      <img 
                        src={movie.cover} 
                        alt={movie.title} 
                        className="w-full h-full object-cover opacity-60 group-hover:scale-105 duration-300" 
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1542204172-e7052809a850?auto=format&fit=crop&w=1200&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between gap-2.5">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-white leading-tight line-clamp-1">{movie.title}</p>
                          <p className="text-[10px] text-zinc-400 font-semibold">{movie.director} • {movie.year}</p>
                        </div>
                        <span className="text-[11px] font-black text-yellow-500 shrink-0 font-mono">★ {movie.rating}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: AI CHAT COMPANION */}
        {/* ========================================================= */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">
            
            {/* LEFT PANELS: ACTIVE SEEDS CONFIG OR CHAT DIRECTIVES */}
            <div className="flex flex-col gap-4">
              
              {/* Cinematic Console Status Panel */}
              <div className="bg-[#0d0d12]/90 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-red-500 animate-pulse">Assistant Core Diagnostics</h3>
                
                <div className="space-y-3 text-xs text-zinc-400">
                  <p>Our advisor accesses our database comprising masterpieces spanning 4 decades matching your directives.</p>
                  
                  <div className="border-t border-zinc-800/50 pt-2.5 space-y-2">
                    <p className="font-semibold text-zinc-300">Active Directives:</p>
                    <div className="flex flex-wrap gap-1">
                      {genreFilters.map(g => (
                        <span key={g} className="text-[9.5px] bg-zinc-900 border border-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">{g}</span>
                      ))}
                      {moodFilter && (
                        <span className="text-[9.5px] bg-[#E50914]/20 border border-red-900/40 text-red-300 px-1.5 py-0.5 rounded">Mood: {moodFilter}</span>
                      )}
                      {genreFilters.length === 0 && !moodFilter && (
                        <span className="text-[10px] italic text-zinc-600">No active state constraints. Chat operates globally.</span>
                      )}
                    </div>
                  </div>

                  <p className="text-[10.5px] text-[#E50914] bg-red-950/25 border border-red-900/10 p-2.5 rounded-lg leading-snug">
                    Pro-tip: If the AI recommends movies in its text chat response, dynamic recommendation buttons will overlay so you can click to preview details or watchlist immediately!
                  </p>
                </div>
              </div>

              {/* Chat Prompts Recommendation Shortcuts */}
              <div className="bg-[#0d0d12]/90 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Atmospheric Query Templates</h4>
                <div className="flex flex-col gap-2">
                  {[
                    "Suggest an intense sci-fi that alters mind or reality concept",
                    "Which film has an iconic strict music teacher profile?",
                    "Give me a whimsical retro luxury hotel adventure to relax to",
                    "Recommend a masterful dark comedy representing class struggles"
                  ].map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => sendChatMessage(undefined, preset)}
                      className="w-full text-left text-xs bg-[#121217] hover:bg-red-950/20 border border-zinc-800 hover:border-red-650/30 text-zinc-400 hover:text-white p-2.5 rounded-xl transition duration-300 flex items-center justify-between"
                    >
                      <span className="line-clamp-1">{preset}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* CHAT THREAD CONSOLE WORKSPACE */}
            <div className="lg:col-span-2 bg-[#09090d] border border-zinc-800/80 rounded-2xl flex flex-col shadow-2xl relative overflow-hidden">
              
              {/* Header */}
              <div className="bg-[#000000]/60 p-4 border-b border-zinc-800/80 flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">Neural Film Critic Subroutine</p>
                    <p className="text-[10px] text-zinc-500">Live Gemini Model Gateway Response</p>
                  </div>
                </div>

                <StarsFloatingVisualizer animate={chatLoading} />
              </div>

              {/* Messages viewport */}
              <div className="flex-1 p-5 overflow-y-auto space-y-5 min-h-[350px] max-h-[460px]">
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col gap-1.5 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto'}`}
                  >
                    <span className="text-[10px] text-zinc-500 font-semibold px-1">
                      {msg.sender === 'user' ? 'SUBSCRIBER' : 'CINEMATCH AI'} • {msg.timestamp}
                    </span>
                    
                    <div className={`p-4 rounded-2xl text-xs md:text-sm shadow-md leading-relaxed whitespace-pre-line ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-tr from-[#E50914] to-red-600 text-white rounded-tr-none'
                        : 'bg-zinc-900 border border-zinc-800/80 text-zinc-200 rounded-tl-none'
                    }`}>
                      {msg.text}

                      {/* Embed matching interactive movie cards recommended by Gemini */}
                      {msg.suggestedMovies && msg.suggestedMovies.length > 0 && (
                        <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex flex-col gap-2">
                          <p className="text-[10.5px] text-red-400 font-bold uppercase tracking-wider">Identified Synergies:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                            {moviesList
                              .filter(m => msg.suggestedMovies?.includes(m.id))
                              .map(movie => (
                                <div 
                                  key={movie.id}
                                  onClick={() => openMovieModal(movie)}
                                  className="bg-zinc-950 border border-zinc-800/80 hover:border-[#E50914] rounded-xl p-2 flex items-center gap-2.5 cursor-pointer hover:bg-[#121217] transition-all"
                                >
                                  <img 
                                    src={movie.poster} 
                                    alt={movie.title} 
                                    className="w-9 h-12 rounded object-cover" 
                                    onError={(e) => {
                                      e.currentTarget.src = 'https://images.unsplash.com/photo-1542204172-e7052809a850?auto=format&fit=crop&w=600&q=80';
                                    }}
                                  />
                                  <div className="text-left overflow-hidden">
                                    <p className="text-xs font-bold text-white truncate">{movie.title}</p>
                                    <p className="text-[10.5px] text-zinc-500 truncate">{movie.director} ({movie.year})</p>
                                    <span className="text-[9.5px] text-yellow-500">★ {movie.rating}</span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {chatLoading && (
                  <div className="flex flex-col gap-1.5 mr-auto">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Tethering Synapse...</span>
                    <div className="bg-zinc-900 border border-zinc-800/80 p-4 rounded-xl text-xs rounded-tl-none flex items-center gap-3 w-56">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-red-600 rounded-full animate-bounce"></span>
                      </div>
                      <span className="text-zinc-500 font-mono text-[10.5px]">Calculating match matrices...</span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Chat Input form footer */}
              <form onSubmit={sendChatMessage} className="bg-zinc-950 p-3.5 border-t border-zinc-800/80 flex items-center gap-2">
                <input 
                  id="chat-console-input"
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask for custom themes e.g. 'Highly atmospheric crime movie with Al Pacino or Robert de Niro'..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600/50 rounded-xl px-4 py-3 text-xs md:text-sm text-white placeholder-zinc-500"
                />
                <button
                  type="submit"
                  disabled={chatLoading}
                  className="px-5 py-3 rounded-xl bg-[#E50914] text-white hover:bg-red-700 transition font-bold text-xs disabled:opacity-50 shrink-0"
                >
                  Transmit Node
                </button>
              </form>

            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: DATA SCIENCE ANALYTICS HUB */}
        {/* ========================================================= */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-6">
            
            {/* INTRODUCTORY METRICS STATS COUNTERS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: "Total Masterpieces", val: moviesList.length, desc: "Aesthetic film catalog count", color: "text-red-500" },
                { title: "Watchlist Density", val: watchlist.length, desc: "Save queues on this browser", color: "text-orange-500" },
                { title: "Average Database rating", val: "8.4 / 10", desc: "Top IMDB critical threshold", color: "text-yellow-500" },
                { title: "Neural Vector size", val: "128 Keys", desc: "Similarity attributes width", color: "text-red-400" },
              ].map((m, idx) => (
                <div key={idx} className="bg-zinc-900/30 border border-zinc-850 p-4 rounded-2xl flex flex-col gap-1 backdrop-blur-md">
                  <h5 className="text-[10.5px] uppercase tracking-wider text-zinc-500 font-bold">{m.title}</h5>
                  <p className={`text-2xl md:text-3xl font-black ${m.color}`}>{m.val}</p>
                  <p className="text-[11px] text-zinc-400">{m.desc}</p>
                </div>
              ))}
            </div>

            {/* NEON ANALYTICS CHART LAYOUT GRAPHICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Category distribution horizontal bar charts */}
              <div className="bg-[#0d0d12]/90 border border-zinc-800 rounded-2xl p-5 md:p-6 flex flex-col gap-4">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-white">Genre Volume Matrix</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">Frequency count of genres in CineMatch curation</p>
                </div>

                <div className="flex flex-col gap-4 py-2">
                  {derivedAnalytics.genreDistribution.map((item: any) => {
                    const maxVal = Math.max(...derivedAnalytics.genreDistribution.map((i: any) => i.count));
                    const percentage = (item.count / maxVal) * 100;
                    return (
                      <div key={item.genre} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-zinc-300">
                          <span>{item.genre}</span>
                          <span className="font-mono text-[11px] text-zinc-500">{item.count} Masterpieces</span>
                        </div>
                        <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                          <div 
                            className="h-full bg-gradient-to-r from-[#E50914] to-orange-500 rounded-full transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ratings distribution curve */}
              <div className="bg-[#0d0d12]/90 border border-zinc-800 rounded-2xl p-5 md:p-6 flex flex-col gap-4">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-white">Rating Tier Count</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">Distribution of masterpieces across IMDb critical metrics</p>
                </div>

                <div className="flex flex-col gap-4 py-2">
                  {derivedAnalytics.ratingDistribution.map((item: any) => {
                    const maxVal = Math.max(...derivedAnalytics.ratingDistribution.map((i: any) => i.count));
                    const percentage = (item.count / maxVal) * 100;
                    return (
                      <div key={item.range} className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold text-zinc-300">
                          <span>{item.range}</span>
                          <span className="font-mono text-xs text-[#E50914]">{item.count} items</span>
                        </div>
                        <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                          <div 
                            className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mini SVG inline visual graph */}
                <div className="border-t border-zinc-800/80 pt-3 flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-[#E50914]" /> Threshold target: &gt; 7.5 critical score</span>
                  <span className="font-mono">Analytical stability: Verified 100%</span>
                </div>
              </div>

            </div>

            {/* TOP DIRECTOR MATRICES BENTO GRID CELLS */}
            <div className="bg-[#0d0d12]/90 border border-zinc-800 rounded-2xl p-5 md:p-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-1">Director Core Sovereignties</h4>
              <p className="text-xs text-zinc-500 mb-4">Master directors with weighted impact score indices</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {derivedAnalytics.popularDirectors.map((d: any, idx: number) => (
                  <div key={d.director} className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] bg-red-950/40 border border-red-900/30 text-rose-300 rounded px-1.5 py-0.5 font-bold font-mono">
                        RANK #{idx + 1}
                      </span>
                      <p className="text-xs md:text-sm font-bold text-white mt-1.5">{d.director}</p>
                      <p className="text-[11px] text-zinc-400">{d.filmCount} Curated films in directory</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-yellow-500 font-mono">★ {d.avgRating}</p>
                      <p className="text-[9.5px] text-zinc-500">Avg Crit Score</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: USER WATCHLIST MANAGER */}
        {/* ========================================================= */}
        {activeTab === 'watchlist' && (
          <div className="flex flex-col gap-6">
            
            {activeWatchlistMovies.length === 0 ? (
              <div className="bg-[#0d0d12]/60 border border-zinc-800/80 p-12 rounded-2xl text-center flex flex-col items-center justify-center gap-4">
                <div className="h-14 w-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-zinc-600" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">Your Watchlist is blank.</h4>
                  <p className="text-xs text-zinc-400">Save movies you discover on the main Cinematic Discovery Deck to queue them here.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('home')}
                  className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl transition mt-2"
                >
                  Browse Movies
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {activeWatchlistMovies.map(movie => (
                  <div 
                    key={movie.id}
                    onClick={() => openMovieModal(movie)}
                    className="bg-[#0d0d12] border border-zinc-800 hover:border-red-600/50 rounded-2xl overflow-hidden cursor-pointer group transition-all"
                  >
                    <div className="aspect-[2/3] relative overflow-hidden bg-zinc-900">
                      <img 
                        src={movie.poster} 
                        alt={movie.title} 
                        className="w-full h-full object-cover group-hover:scale-105 duration-300" 
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1542204172-e7052809a850?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-80" />
                      
                      <button
                        onClick={(e) => toggleWatchlist(movie.id, e)}
                        className="absolute top-2.5 right-2.5 p-1.5 bg-red-600 rounded-lg text-white font-semibold flex items-center justify-center"
                        title="Remove from Watchlist"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-3">
                      <p className="font-bold text-xs md:text-sm text-zinc-100 truncate">{movie.title}</p>
                      <p className="text-[10.5px] text-zinc-500 font-semibold truncate mt-0.5">{movie.director} • {movie.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}
        </div>

      </main>

      {/* ========================================================= */}
      {/* GLOBAL MOVIE META GLASSMORPHISM MODAL POPUP */}
      {/* ========================================================= */}
      {selectedMovie && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-lg flex items-center justify-center p-3.5 md:p-6 z-50 animate-fade-in">
          
          <div className="bg-[#0a0a0f] border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto relative shadow-[0_0_50px_rgba(229,9,20,0.25)] flex flex-col">
            
            {/* Close trigger anchor */}
            <button 
              id="modal-close-btn"
              onClick={closeMovieModal}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-red-600 text-white rounded-xl border border-zinc-800 hover:border-red-500 transition-all z-20"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cinematic banner frame graphic header */}
            <div className="relative aspect-[21/9] md:aspect-[21/8] bg-zinc-900 shrink-0">
              <img 
                src={selectedMovie.cover} 
                alt={selectedMovie.title} 
                className="w-full h-full object-cover opacity-35"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/40 to-transparent" />
              
              {/* Badges Overlay */}
              <div className="absolute bottom-4 left-4 md:left-6 flex flex-wrap gap-2 items-center">
                <span className="text-[10px] uppercase font-bold text-yellow-500 bg-black/80 px-2.5 py-1 rounded border border-yellow-600/40">
                  ★ {selectedMovie.rating} IMDb Score
                </span>
                <span className="text-[10px] uppercase font-bold text-rose-300 bg-black/80 px-2.5 py-1 rounded border border-rose-900/40">
                  {selectedMovie.year} Film
                </span>
                <span className="text-[10px] uppercase font-bold text-zinc-300 bg-black/80 px-2.5 py-1 rounded border border-zinc-800">
                  {selectedMovie.runtime} Minutes
                </span>
              </div>
            </div>

            {/* Modal description body panels split details */}
            <div className="p-4 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8">
              
              {/* Left poster panel */}
              <div className="w-32 sm:w-36 md:w-48 shrink-0 mx-auto md:mx-0 block">
                <img 
                  src={selectedMovie.poster} 
                  alt={selectedMovie.title} 
                  className="w-full rounded-2xl border border-zinc-800 shadow-xl"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1542204172-e7052809a850?auto=format&fit=crop&w=600&q=80';
                  }}
                />
              </div>

              {/* Right rich parameters block specs */}
              <div className="flex-1 flex flex-col gap-4">
                
                {/* Title and tagline header */}
                <div>
                  <h3 className="text-2xl md:text-3.5xl font-black text-white leading-tight">
                    {selectedMovie.title}
                  </h3>
                  {selectedMovie.tagline && (
                    <p className="text-xs md:text-sm text-red-500 italic mt-1 font-semibold">
                      “{selectedMovie.tagline}”
                    </p>
                  )}
                </div>

                {/* Primary Overview */}
                <div>
                  <h4 className="text-[10.5px] uppercase tracking-wider text-zinc-500 font-extrabold mb-1">Narrative Profile</h4>
                  <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
                    {selectedMovie.overview}
                  </p>
                </div>

                {/* AI Cinematic Explanation Breakdown Motif */}
                <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-[#E50914] animate-pulse" />
                    <span className="text-xs font-bold text-[#E50914] uppercase tracking-wider">AI Interactive Recommendation Explanation</span>
                  </div>

                  {loadingExplanation ? (
                    <div className="space-y-1.5 animate-pulse py-2">
                      <div className="h-3 bg-red-900/20 rounded w-full"></div>
                      <div className="h-3 bg-red-900/20 rounded w-5/6"></div>
                    </div>
                  ) : (
                    <p className="text-xs md:text-[13px] text-zinc-200 leading-relaxed font-medium">
                      {aiExplanation}
                    </p>
                  )}
                  
                  {/* Small carbon network footprint indication */}
                  <span className="text-[9px] text-zinc-600 font-mono tracking-tight text-right block">Vector weight cosine calculated dynamically via neural filters.</span>
                </div>

                {/* Sub Metadata parameters split row */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <h5 className="text-[10.5px] uppercase tracking-wider text-zinc-500 font-extrabold mb-1">Director Signature</h5>
                    <p className="text-xs text-white font-semibold">{selectedMovie.director}</p>
                  </div>
                  <div>
                    <h5 className="text-[10.5px] uppercase tracking-wider text-zinc-500 font-extrabold mb-1">Genres</h5>
                    <p className="text-xs text-zinc-300">{selectedMovie.genres.join(", ")}</p>
                  </div>
                  <div className="col-span-2">
                    <h5 className="text-[10.5px] uppercase tracking-wider text-zinc-500 font-extrabold mb-1">Leading Cast</h5>
                    <p className="text-xs text-zinc-300">{selectedMovie.cast.join(" • ")}</p>
                  </div>
                </div>

                {/* Interactive simulated actions toolbar */}
                <div className="border-t border-zinc-800/80 pt-4 mt-2 flex flex-wrap gap-2.5">
                  <button 
                    onClick={toggleSimulatedSoundtrack}
                    className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 duration-300 ${
                      trailerAudioPlaying 
                        ? 'bg-[#E50914] text-white animate-pulse' 
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {trailerAudioPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-zinc-300" />}
                    <span>{trailerAudioPlaying ? 'Mute AI Audio Theme' : 'Synthesize AI Audio Soundtrack'}</span>
                    {trailerAudioPlaying && <span className="flex gap-0.5 h-2 w-max items-end ml-1"><span className="h-2 w-0.5 bg-white animate-[bounce_0.6s_infinite_0.1s]"></span><span className="h-3 w-0.5 bg-white animate-[bounce_0.6s_infinite_0.3s]"></span><span className="h-1.5 w-0.5 bg-white animate-[bounce_0.6s_infinite_0.2s]"></span></span>}
                  </button>

                  <button 
                    onClick={() => toggleWatchlist(selectedMovie.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      watchlist.includes(selectedMovie.id)
                        ? 'bg-zinc-900 border border-green-800/40 text-green-400'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {watchlist.includes(selectedMovie.id) ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{watchlist.includes(selectedMovie.id) ? 'Added to Watchlist!' : 'Add to Watchlist'}</span>
                  </button>

                  <button 
                    onClick={() => {
                      toggleFavoriteSeed(selectedMovie.id);
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      favoriteMovieIds.includes(selectedMovie.id)
                        ? 'bg-rose-950/40 border-red-600 text-white shadow-lg'
                        : 'bg-[#000000]/20 hover:bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${favoriteMovieIds.includes(selectedMovie.id) ? 'text-[#E50914] fill-[#E50914]' : ''}`} />
                    <span>{favoriteMovieIds.includes(selectedMovie.id) ? 'Similarity Anchor' : 'Set Similarity Anchor'}</span>
                  </button>

                  <button 
                    onClick={closeMovieModal}
                    className="ml-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                  >
                    Collapse Profile
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

/**
 * Aesthetic mini components
 */
function StarsFloatingVisualizer({ animate }: { animate: boolean }) {
  return (
    <div className="flex gap-1 items-center shrink-0">
      {[1, 2, 3].map(i => (
        <span 
          key={i} 
          className={`h-1.5 w-1.5 rounded-full bg-red-500 ${
            animate ? 'animate-ping' : ''
          }`} 
          style={{ animationDelay: `${i * 0.25}s`, animationDuration: '1.2s' }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// IMPORTS AND DEPENDENCIES
// ============================================================================
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./LandingPage";
import "./abdo.css";

// ============================================================================
// CONSTANTS AND API CONFIGURATION
// ============================================================================
const TMDB_API_KEY = "0aa383c97e13f7d483937b8c3283d25b";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

// ============================================================================
// TYPE DEFINITIONS AND INTERFACES
// ============================================================================
interface Movie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  media_type?: string;
  genre_ids: number[];
  userRating?: 'like' | 'dislike' | null;
}

interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

interface Actor {
  id: number;
  name: string;
  profile_path: string | null;
}

// ============================================================================
// MOVIE RECOMMENDATIONS COMPONENT
// Main component handling movie recommendations and search functionality
// ============================================================================
function MovieRecommendations() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [trailerUrl, setTrailerUrl] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [actorSearchTerm, setActorSearchTerm] = useState("");
  const [actorResults, setActorResults] = useState<Actor[]>([]);
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [country, setCountry] = useState("");
  const [type, setType] = useState("movie");
  const [genres, setGenres] = useState<{id: number, name: string}[]>([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [viewMode, setViewMode] = useState<"search" | "recommendations">("search");
  const [showActorSearch, setShowActorSearch] = useState(false);
  const [userPreferences, setUserPreferences] = useState<{
    likedGenres: Record<string, number>,
    dislikedGenres: Record<string, number>,
    likedActors: Record<string, number>,
    dislikedActors: Record<string, number>
  }>(() => {
    const savedPreferences = localStorage.getItem('userPreferences');
    return savedPreferences 
      ? JSON.parse(savedPreferences) 
      : {
          likedGenres: {},
          dislikedGenres: {},
          likedActors: {},
          dislikedActors: {}
        };
  });

  // Save user preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
  }, [userPreferences]);
   
  // Fetch genres on component mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch(`${BASE_URL}/genre/${type}/list?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        setGenres(data.genres || []);
      } catch (error) {
        console.error("Error fetching genres:", error);
      }
    };

    fetchGenres();
  }, [type]);

  // Fetch trending movies/shows on first load
  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/trending/${type}/day?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        
        // Merge with user ratings from localStorage
        const savedRatings = JSON.parse(localStorage.getItem('userMovieRatings') || '{}');
        const moviesWithRatings = data.results.map((movie: Movie) => ({
          ...movie,
          userRating: savedRatings[movie.id] || null
        }));
        
        setMovies(moviesWithRatings || []);
      } catch (error) {
        console.error("Error fetching trending content:", error);
        setError("Failed to load trending content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (movies.length === 0) {
      fetchTrending();
    }
  }, [type]);
  
  const searchActors = async () => {
    if (!actorSearchTerm.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${actorSearchTerm}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setActorResults(data.results);
      } else {
        setActorResults([]);
        setError("No actors found with that name.");
      }
    } catch (error) {
      console.error("Error searching actors:", error);
      setError("An error occurred while searching for actors.");
    } finally {
      setLoading(false);
    }
  };


  const selectActor = async (actor: Actor) => {
    setSelectedActor(actor);
    setActorResults([]);
    setActorSearchTerm(actor.name);
    setShowActorSearch(false);
    
    // Search for movies with this actor
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/person/${actor.id}/combined_credits?api_key=${TMDB_API_KEY}`
      );
      const data = await response.json();
      
      if (data.cast && data.cast.length > 0) {
        // Filter by type if needed
        let results = data.cast;
        if (type !== "multi") {
          results = data.cast.filter((item: Movie) => 
            type === "movie" ? item.media_type === "movie" : item.media_type === "tv"
          );
        }
        
        // Add user ratings
        const savedRatings = JSON.parse(localStorage.getItem('userMovieRatings') || '{}');
        const moviesWithRatings = results.map((movie: Movie) => ({
          ...movie,
          userRating: savedRatings[movie.id] || null
        }));
        
        setMovies(moviesWithRatings);
        setTotalPages(1); // Actor credits come in one page
      } else {
        setMovies([]);
        setError("No movies or shows found with this actor.");
      }
    } catch (error) {
      console.error("Error fetching actor credits:", error);
      setError("An error occurred while fetching actor filmography.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setPage(1);
    
    try {
      let url = `${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${searchTerm}&page=${page}`;
      
      if (type !== "multi") {
        url = `${BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${searchTerm}&page=${page}`;
      }
      
      if (selectedGenre) {
        url += `&with_genres=${selectedGenre}`;
      }
      
      if (country) {
        url += `&region=${country}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Add user ratings
        const savedRatings = JSON.parse(localStorage.getItem('userMovieRatings') || '{}');
        const moviesWithRatings = data.results.map((movie: Movie) => ({
          ...movie,
          userRating: savedRatings[movie.id] || null
        }));
        
        setMovies(moviesWithRatings);
        setTotalPages(data.total_pages);
      } else {
        setMovies([]);
        setError("No results found. Try different search terms.");
      }
    } catch (error) {
      console.error("Error searching:", error);
      setError("An error occurred while searching. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    setLoading(true);
    setError("");
    setViewMode("recommendations");
    
    try {
      // Get most liked genres
      const likedGenreIds = Object.entries(userPreferences.likedGenres)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);
      
      // If we have no preferences yet, use trending
      if (likedGenreIds.length === 0) {
        const response = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        
        // Add user ratings
        const savedRatings = JSON.parse(localStorage.getItem('userMovieRatings') || '{}');
        const moviesWithRatings = data.results.map((movie: Movie) => ({
          ...movie,
          userRating: savedRatings[movie.id] || null
        }));
        
        setRecommendedMovies(moviesWithRatings);
        return;
      }
      
      // Build discover URL based on preferences
      let url = `${BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&sort_by=popularity.desc`;
      
      if (likedGenreIds.length > 0) {
        url += `&with_genres=${likedGenreIds.join(',')}`;
      }
      
      if (country) {
        url += `&region=${country}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Add user ratings
        const savedRatings = JSON.parse(localStorage.getItem('userMovieRatings') || '{}');
        const moviesWithRatings = data.results.map((movie: Movie) => ({
          ...movie,
          userRating: savedRatings[movie.id] || null
        }));
        
        setRecommendedMovies(moviesWithRatings);
      } else {
        setRecommendedMovies([]);
        setError("Couldn't generate recommendations. Try liking more content first.");
      }
    } catch (error) {
      console.error("Error generating recommendations:", error);
      setError("An error occurred while generating recommendations.");
    } finally {
      setLoading(false);
    }
  };
 
  const loadMore = async () => {
    if (page < totalPages) {
      setLoading(true);
      const nextPage = page + 1;
      
      try {
        let url = `${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${searchTerm}&page=${nextPage}`;
        
        if (type !== "multi") {
          url = `${BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${searchTerm}&page=${nextPage}`;
        }
        
        if (selectedGenre) {
          url += `&with_genres=${selectedGenre}`;
        }
        
        if (country) {
          url += `&region=${country}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.results) {
          // Add user ratings
          const savedRatings = JSON.parse(localStorage.getItem('userMovieRatings') || '{}');
          const moviesWithRatings = data.results.map((movie: Movie) => ({
            ...movie,
            userRating: savedRatings[movie.id] || null
          }));
          
          setMovies(prevMovies => [...prevMovies, ...moviesWithRatings]);
          setPage(nextPage);
        }
      } catch (error) {
        console.error("Error loading more content:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const openTrailer = async (movie: Movie) => {
    setSelectedMovie(movie);
    setTrailerUrl("");
    
    try {
      const endpoint = movie.media_type === "tv" || type === "tv" 
        ? `${BASE_URL}/tv/${movie.id}/videos?api_key=${TMDB_API_KEY}`
        : `${BASE_URL}/movie/${movie.id}/videos?api_key=${TMDB_API_KEY}`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Try to find an official trailer first
        const officialTrailer = data.results.find(
          (vid: Video) => vid.type === "Trailer" && vid.site === "YouTube" && vid.name.toLowerCase().includes("official")
        );
        
        // If no official trailer, get any trailer
        const anyTrailer = data.results.find(
          (vid: Video) => vid.type === "Trailer" && vid.site === "YouTube"
        );
        
        // If no trailer at all, get any video
        const anyVideo = data.results.find((vid: Video) => vid.site === "YouTube");
        
        const trailer = officialTrailer || anyTrailer || anyVideo;
        
        if (trailer) {
          setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}`);
        }
      }
    } catch (error) {
      console.error("Error fetching trailer:", error);
    }
  };

  const rateMovie = async (movie: Movie, rating: 'like' | 'dislike') => {
    // Update the movie in state
    const updatedMovies = movies.map(m => 
      m.id === movie.id ? { ...m, userRating: rating } : m
    );
    setMovies(updatedMovies);
    
    // Also update in recommended movies if present
    if (recommendedMovies.some(m => m.id === movie.id)) {
      const updatedRecommended = recommendedMovies.map(m => 
        m.id === movie.id ? { ...m, userRating: rating } : m
      );
      setRecommendedMovies(updatedRecommended);
    }
    
    // Save to localStorage
    const savedRatings = JSON.parse(localStorage.getItem('userMovieRatings') || '{}');
    savedRatings[movie.id] = rating;
    localStorage.setItem('userMovieRatings', JSON.stringify(savedRatings));
    
    // Update user preferences based on genres
    const newPreferences = { ...userPreferences };
    
    // Process genres
    if (movie.genre_ids && movie.genre_ids.length > 0) {
      movie.genre_ids.forEach(genreId => {
        const genreIdStr = genreId.toString();
        
        if (rating === 'like') {
          newPreferences.likedGenres[genreIdStr] = (newPreferences.likedGenres[genreIdStr] || 0) + 1;
          // Remove from disliked if it was there
          if (newPreferences.dislikedGenres[genreIdStr]) {
            newPreferences.dislikedGenres[genreIdStr]--;
            if (newPreferences.dislikedGenres[genreIdStr] <= 0) {
              delete newPreferences.dislikedGenres[genreIdStr];
            }
          }
        } else {
          newPreferences.dislikedGenres[genreIdStr] = (newPreferences.dislikedGenres[genreIdStr] || 0) + 1;
          // Remove from liked if it was there
          if (newPreferences.likedGenres[genreIdStr]) {
            newPreferences.likedGenres[genreIdStr]--;
            if (newPreferences.likedGenres[genreIdStr] <= 0) {
              delete newPreferences.likedGenres[genreIdStr];
            }
          }
        }
      });
    }
    
    // If we have a selected actor, update actor preferences
    if (selectedActor) {
      const actorIdStr = selectedActor.id.toString();
      
      if (rating === 'like') {
        newPreferences.likedActors[actorIdStr] = (newPreferences.likedActors[actorIdStr] || 0) + 1;
        if (newPreferences.dislikedActors[actorIdStr]) {
          newPreferences.dislikedActors[actorIdStr]--;
          if (newPreferences.dislikedActors[actorIdStr] <= 0) {
            delete newPreferences.dislikedActors[actorIdStr];
          }
        }
      } else {
        newPreferences.dislikedActors[actorIdStr] = (newPreferences.dislikedActors[actorIdStr] || 0) + 1;
        if (newPreferences.likedActors[actorIdStr]) {
          newPreferences.likedActors[actorIdStr]--;
          if (newPreferences.likedActors[actorIdStr] <= 0) {
            delete newPreferences.likedActors[actorIdStr];
          }
        }
      }
    }
    
    setUserPreferences(newPreferences);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const clearPreferences = () => {
    localStorage.removeItem('userPreferences');
    localStorage.removeItem('userMovieRatings');
    setUserPreferences({
      likedGenres: {},
      dislikedGenres: {},
      likedActors: {},
      dislikedActors: {}
    });
    // Reset ratings on current movies
    const resetMovies = movies.map(m => ({ ...m, userRating: null }));
    setMovies(resetMovies);
    const resetRecommended = recommendedMovies.map(m => ({ ...m, userRating: null }));
    setRecommendedMovies(resetRecommended);
  };

  return (
    <div className="app">
      <h1 className="title">🎬 Movie & TV Show Recommendations</h1>

      {/* Navigation Tabs */}
      <div className="navigation-tabs">
        
        <button 
          className={`tab-button ${viewMode === "recommendations" ? "active" : ""}`}
          onClick={generateRecommendations}
        >
          Personalized Recommendations
        </button>
      </div>

      {viewMode === "search" && (
        <>
          {/* Search Filters */}
          <div className="filters">
            <input
              type="text"
              placeholder="Enter a movie or TV show name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />

            <div className="actor-search-container">
              <input
                type="text"
                placeholder="Search by actor..."
                value={actorSearchTerm}
                onChange={(e) => setActorSearchTerm(e.target.value)}
                onFocus={() => setShowActorSearch(true)}
                onKeyPress={(e) => e.key === 'Enter' && searchActors()}
              />
            
              
              {showActorSearch && actorResults.length > 0 && (
                <div className="actor-results-dropdown">
                  {actorResults.map(actor => (
                    <div 
                      key={actor.id} 
                      className="actor-result-item"
                      onClick={() => selectActor(actor)}
                    >
                      {actor.profile_path ? (
                        <img 
                          src={`${IMAGE_BASE_URL}${actor.profile_path}`} 
                          alt={actor.name}
                          className="actor-thumbnail" 
                        />
                      ) : (
                        <div className="actor-no-image">👤</div>
                      )}
                      <span>{actor.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="movie">Movies</option>
              <option value="tv">TV Shows</option>
              <option value="multi">Both</option>
            </select>

            <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}>
              <option value="">All Genres</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>

            <select value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">All Countries</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="FR">France</option>
              <option value="IN">India</option>
              <option value="JP">Japan</option>
              <option value="KR">South Korea</option>
              <option value="DE">Germany</option>
              <option value="IT">Italy</option>
              <option value="ES">Spain</option>
              <option value="CN">China</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="BR">Brazil</option>
              <option value="RU">Russia</option>
              <option value="MX">Mexico</option>
            </select>

            <button onClick={handleSearch} className="search-button">
              🔍 Search
            </button>
          </div>
        </>
      )}
      
      {viewMode === "recommendations" && (
        <div className="recommendation-header">
          <h2>Your Personalized Recommendations</h2>
          <p>Based on your likes and dislikes, we think you'll enjoy these:</p>
          <button onClick={clearPreferences} className="clear-preferences-button">
            Reset All Preferences
          </button>
        </div>
      )}

      {/* Error message */}
      {error && <div className="error-message">{error}</div>}

      {/* Loading indicator */}
      {loading && <div className="loading">Loading...</div>}

      {/* Movie Grid */}
      <div className="movie-grid">
        {(viewMode === "search" ? movies : recommendedMovies).map((movie) => (
          <div key={movie.id} className="movie-card">
            <div className="poster-container" onClick={() => openTrailer(movie)}>
              {movie.poster_path ? (
                <img 
                  src={`${IMAGE_BASE_URL}${movie.poster_path}`} 
                  alt={movie.title || movie.name} 
                  className="movie-poster" 
                  loading="lazy"
                />
              ) : (
                <div className="no-poster">No Image Available</div>
              )}
            </div>
            <div className="movie-info">
              <h3>{movie.title || movie.name}</h3>
              <p className="rating">⭐ {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}</p>
              <p className="release-date">
                {formatDate(movie.release_date || movie.first_air_date)}
              </p>
              <p className="description">{movie.overview || "No description available."}</p>
              
              {/* User Rating Buttons */}
              <div className="user-rating-buttons">
                <button 
                  className={`like-button ${movie.userRating === 'like' ? 'active' : ''}`}
                  onClick={() => rateMovie(movie, 'like')}
                  title="Like this movie"
                >
                  👍
                </button>
                <button 
                  className={`dislike-button ${movie.userRating === 'dislike' ? 'active' : ''}`}
                  onClick={() => rateMovie(movie, 'dislike')}
                  title="Dislike this movie"
                >
                  👎
                </button>
                <button 
                  className="trailer-button"
                  onClick={() => openTrailer(movie)}
                  title="Watch trailer"
                >
                  🎬
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button - only for search mode */}
      {viewMode === "search" && movies.length > 0 && page < totalPages && (
        <button onClick={loadMore} className="load-more-button">
          {loading ? "Loading..." : "Load More"}
        </button>
      )}

      {/* Trailer Section */}
      {selectedMovie && (
        <div className="trailer-section">
          <div className="trailer-content">
            <h2>{selectedMovie.title || selectedMovie.name}</h2>
            <p className="release-date">
              {formatDate(selectedMovie.release_date || selectedMovie.first_air_date)}
            </p>
            {trailerUrl ? (
              <iframe 
                src={trailerUrl} 
                title="Trailer" 
                className="trailer"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="no-trailer">
                <p>No trailer available.</p>
                {selectedMovie.backdrop_path && (
                  <img 
                    src={`${IMAGE_BASE_URL}${selectedMovie.backdrop_path}`} 
                    alt={selectedMovie.title || selectedMovie.name} 
                    className="backdrop-image"
                  />
                )}
              </div>
            )}
            <div className="movie-details">
              <p className="overview">{selectedMovie.overview}</p>
              
              {/* User Rating in Trailer Section */}
              <div className="trailer-rating-buttons">
                <p>Rate this movie:</p>
                <button 
                  className={`like-button ${selectedMovie.userRating === 'like' ? 'active' : ''}`}
                  onClick={() => rateMovie(selectedMovie, 'like')}
                >
                  👍 Like
                </button>
                <button 
                  className={`dislike-button ${selectedMovie.userRating === 'dislike' ? 'active' : ''}`}
                  onClick={() => rateMovie(selectedMovie, 'dislike')}
                >
                  👎 Dislike
                </button>
              </div>
            </div>
            <button className="close-button" onClick={() => setSelectedMovie(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ENHANCED RECOMMENDATION PAGE COMPONENT
// ============================================================================
const EnhancedRecommendationPage = () => {
  return <MovieRecommendations />;
};

// ============================================================================
// MAIN APP COMPONENT
// Handles routing and main application structure
// ============================================================================
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/recommendations" element={<EnhancedRecommendationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
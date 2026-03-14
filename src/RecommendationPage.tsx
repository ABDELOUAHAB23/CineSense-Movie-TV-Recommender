import React, { useState } from "react";
import axios from "axios";
import "./recommendation.css";
import MyAnimation from "./LottieAnimation";

const TMDB_API_KEY = "0aa383c97e13f7d483937b8c3283d25b";

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
}

interface Actor {
  id: number;
  name: string;
  profile_path: string;
  popularity: number;
}

const RecommendationPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);

  const searchActors = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter an actor's name");
      return;
    }

    setLoading(true);
    setError("");
    setActors([]);
    setSelectedActor(null);
    setMovies([]);

    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/search/person`,
        {
          params: {
            api_key: TMDB_API_KEY,
            query: searchQuery,
            include_adult: false,
          },
        }
      );

      if (response.data.results.length === 0) {
        setError("No actors found. Please try a different name.");
      } else {
        const relevantActors = response.data.results
          .filter((actor: Actor) => actor.profile_path && actor.popularity > 1)
          .slice(0, 8);
        setActors(relevantActors);
      }
    } catch (err) {
      setError("Failed to search for actors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getActorMovies = async (actorId: number) => {
    setLoading(true);
    setError("");
    setMovies([]);

    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/person/${actorId}/movie_credits`,
        {
          params: {
            api_key: TMDB_API_KEY,
            language: 'en-US',
          },
        }
      );

      if (!response.data.cast || response.data.cast.length === 0) {
        setError("No movies found for this actor.");
      } else {
        const sortedMovies = response.data.cast
          .filter((movie: Movie) => movie.poster_path && movie.release_date)
          .sort((a: Movie, b: Movie) => b.vote_average - a.vote_average)
          .slice(0, 12);
        setMovies(sortedMovies);
      }
    } catch (err) {
      setError("Failed to fetch actor's movies. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleActorSelect = (actor: Actor) => {
    setSelectedActor(actor);
    getActorMovies(actor.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchActors();
    }
  };

  const handleBackClick = () => {
    setSelectedActor(null);
    setMovies([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="recommendation-page">
      <div className="recommendation-content">
        <h1>Find Your Favorite Actor's Movies 🎬</h1>
        
        <div className="search-container">
          <div className="search-box">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter actor's name..."
              className="search-input"
            />
            <button 
              onClick={searchActors} 
              disabled={loading || !searchQuery.trim()}
              className="search-button"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>

        {loading && (
          <div className="loading-animation">
            <MyAnimation animationType="first" />
          </div>
        )}

        {actors.length > 0 && !selectedActor && (
          <div className="results-section">
            <h2>Search Results</h2>
            <div className="actors-grid">
              {actors.map((actor) => (
                <div
                  key={actor.id}
                  className="actor-card"
                  onClick={() => handleActorSelect(actor)}
                >
                  <div className="actor-image">
                    <img
                      src={`https://image.tmdb.org/t/p/w300${actor.profile_path}`}
                      alt={actor.name}
                      loading="lazy"
                    />
                  </div>
                  <div className="actor-info">
                    <h3>{actor.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedActor && (
          <div className="selected-actor">
            <button className="back-button" onClick={handleBackClick}>
              ← Back to Search Results
            </button>
            <h2>{selectedActor.name}'s Movies</h2>
            {movies.length > 0 ? (
              <div className="movies-grid">
                {movies.map((movie) => (
                  <div key={movie.id} className="movie-card">
                    <div className="movie-image">
                      <img
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.title}
                        loading="lazy"
                      />
                    </div>
                    <div className="movie-info">
                      <h3>{movie.title}</h3>
                      <p className="release-date">
                        {new Date(movie.release_date).getFullYear()}
                      </p>
                      <p className="rating">⭐ {movie.vote_average.toFixed(1)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !loading && <p className="no-movies">No movies found for this actor.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationPage;

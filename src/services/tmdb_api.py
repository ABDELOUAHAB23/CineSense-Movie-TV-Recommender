import requests

TMDB_API_KEY = "0aa383c97e13f7d483937b8c3283d25b"
BASE_URL = "https://api.themoviedb.org/3"
IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

def search_movie(movie_name):
    """Search for a movie by name and return details"""
    url = f"{BASE_URL}/search/movie?api_key={TMDB_API_KEY}&query={movie_name}"
    response = requests.get(url).json()
    if response["results"]:
        movie = response["results"][0]
        return {
            "id": movie["id"],
            "title": movie["title"],
            "description": movie["overview"],
            "poster": f"{IMAGE_BASE_URL}{movie['poster_path']}" if movie['poster_path'] else None,
            "backdrop": f"{IMAGE_BASE_URL}{movie['backdrop_path']}" if movie['backdrop_path'] else None,
            "release_date": movie["release_date"],
            "rating": movie["vote_average"]
        }
    return None

def search_tv(tv_name):
    """Search for a TV show by name and return details"""
    url = f"{BASE_URL}/search/tv?api_key={TMDB_API_KEY}&query={tv_name}"
    response = requests.get(url).json()
    if response["results"]:
        tv = response["results"][0]
        return {
            "id": tv["id"],
            "title": tv["name"],
            "description": tv["overview"],
            "poster": f"{IMAGE_BASE_URL}{tv['poster_path']}" if tv['poster_path'] else None,
            "backdrop": f"{IMAGE_BASE_URL}{tv['backdrop_path']}" if tv['backdrop_path'] else None,
            "first_air_date": tv["first_air_date"],
            "rating": tv["vote_average"]
        }
    return None

def get_movie_recommendations(movie_id):
    """Fetch recommended movies based on a movie ID"""
    url = f"{BASE_URL}/movie/{movie_id}/recommendations?api_key={TMDB_API_KEY}"
    response = requests.get(url).json()
    return [{"id": movie["id"], "title": movie["title"]} for movie in response.get("results", [])]

def get_tv_recommendations(tv_id):
    """Fetch recommended TV shows based on a TV show ID"""
    url = f"{BASE_URL}/tv/{tv_id}/recommendations?api_key={TMDB_API_KEY}"
    response = requests.get(url).json()
    return [{"id": tv["id"], "title": tv["name"]} for tv in response.get("results", [])]

document.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.getElementById('search-bar');
    const searchButton = document.getElementById('search-button');
    let currentIndex = -1; // Keeps track of the current suggestion index

    searchBar.addEventListener('input', (event) => {
        showSuggestions(event.target.value);
        currentIndex = -1; // Reset index on new input
    });

    searchBar.addEventListener('keydown', (event) => {
        const suggestions = document.querySelectorAll('.suggestion-item');

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (currentIndex < suggestions.length - 1) {
                currentIndex++;
                highlightSuggestion(suggestions, currentIndex);
            }
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (currentIndex > 0) {
                currentIndex--;
                highlightSuggestion(suggestions, currentIndex);
            }
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (currentIndex >= 0 && currentIndex < suggestions.length) {
                searchBar.value = suggestions[currentIndex].textContent;
                document.getElementById('suggestions').innerHTML = '';
                searchEvents();
            }
        }
    });

    searchButton.addEventListener('click', () => {
        searchEvents();
    });

    function highlightSuggestion(suggestions, index) {
        suggestions.forEach((item, i) => {
            if (i === index) {
                item.classList.add('highlight');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('highlight');
            }
        });
    }

    function searchEvents() {

        const query = searchBar.value;
        if (query.length === 0) {
            return;
        }
        // Make API call to fetch events
        console.log("Debugging 1");

        getToken()
            .then(token => {
                console.log("Token fetched!" + token.access_token);
                
                
                searchArtist(query, token.access_token)
                    .then(artistId => {
                        
                        getRecommendations(artistId, token.access_token);      
                        console.log("yayyy")
                    });
            })

    }


// Function to get recommendations based on artist id
async function getRecommendations(artistSeed, access_token) {
  try {
   
    const seed_artist = artistSeed + ",";

    // Endpoint for reccs
    const endpoint = `https://api.spotify.com/v1/recommendations?seed_artists=${seed_artist}`;

    // Request configuration
    const config = {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    };

    // Send GET request to Spotify API
    const response = await fetch(endpoint, config);
    const data = await response.json();

    // Extract and display recommended artists
    const artists = data.tracks.map(track => track.artists[0].name);
    console.log('Recommended Artists:', artists);

  } catch (error) {
    console.error('Error fetching recommendations:', error.message);
    throw error;
  }}


    async function getToken() {
            
        try {
            const client_id = 'd58a56f6d4194ddaac431cc035ef19bf'; 
            const client_secret = 'ad2c8a90376542d4a15e1f84b50471d4';
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                    body: new URLSearchParams({
                    'grant_type': 'client_credentials',
                    }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    //   'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
                    'Authorization': 'Basic ' + (btoa(client_id + ':' + client_secret)),
                },
            });
            return await response.json();
        } catch(error) {
            console.error(error);
            throw error;
        }
        
    }

    //function to search for an artist and get the artist id
//this is needed because, in order to get reccs, we need the artist id - not the artist name.
    async function searchArtist(artistName, access_token) {
        const accessToken = await getToken();
        const endpoint = `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist`;
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });
            if (!response.ok) {
                throw new Error('Could not find artist');
            }
            const data = await response.json();
            console.log("HELLOasdfsadf");
            console.log(data.artists.items[0].id);
            console.log(data.artists.items[0].name);
            return data.artists.items[0].id;
            
        } catch (error) {
            console.error('error searching for artist',error);
            throw error;
        }
        
    }
        

    function showSuggestions(query) {
        if (query.length === 0) {
            document.getElementById('suggestions').innerHTML = '';
            return;
        }

        // Make API call to fetch suggestions
        const apiFetchLink = `https://app.ticketmaster.com/discovery/v2/suggest?apikey=NRNGP7p9IHnBQvw0ip9rH6d5W7gxbimk&keyword=${query}`;
        fetch(apiFetchLink, { method: 'GET' })
            .then(response => response.json())
            .then(data => {
                console.log('Suggestion data:', data);
                if (data && data._embedded && data._embedded.attractions) {
                    const suggestions = data._embedded.attractions.map(attraction => `
                        <div class="suggestion-item" data-value="${attraction.name}">${attraction.name}</div>
                    `).join('');
                    document.getElementById('suggestions').innerHTML = suggestions;

                    // Add click event listeners to each suggestion item
                    document.querySelectorAll('.suggestion-item').forEach(item => {
                        item.addEventListener('click', function () {
                            const value = this.getAttribute('data-value');
                            console.log('Suggestion clicked:', value); // Debug log
                            searchBar.value = value;
                            document.getElementById('suggestions').innerHTML = '';
                            searchEvents();
                        });
                    });
                } else {
                    document.getElementById('suggestions').innerHTML = '<div class="error">No suggestions found</div>';
                }
            })
            .catch(error => {
                console.error('Error fetching suggestions:', error);
                document.getElementById('suggestions').innerHTML = `<div class="error">${error.message}</div>`;
            });
    }
});

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
                runProgram();
            }
        }
    });

    searchButton.addEventListener('click', () => {
        runProgram();
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

//the code I wrote starts here!

    // the runProgram function calls three functions:
    //1. getToken gets the token,
    //1. getArtistId searches for the artist ID using the artist name (and token)
    // 3. getRecommendations gets the similar artists, using the artist Id (and token)
    async function runProgram() {

        const artistName = searchBar.value; //grab value that user inputs
        if (artistName.length === 0) {
            return;
        }
        
        try {
            //use the Spotify API's user credentials to retrieve a token,
            //which will be needed to actually query the API
            //I think this is specific to the Spotify API. Token is randomly generated each time I think
            const token = await getToken();

            //then, use artist name (extracted from the search bar value) to get artist ID
            //example of an artist ID: in the following Spotify URL,
            //https://open.spotify.com/artist/2clS9uX2uOrHHqkyDMkzA1
            //the artist ID would be 2clS9uX2uOrHHqkyDMkzA1
            const artistId = await getArtistId(artistName, token.access_token);

            //use artist ID to get recs of similar artists
            //The getRecommendations function currently just console logs
            //these similar artists, and needs to be changed to write to the DOM
            await getRecommendations(artistId, token.access_token);

        } catch (error) {
            console.error("Error: ", error);
        }
    
    }


//getToken uses the client ID and the client secret to retrieve a token
//documentation: https://developer.spotify.com/documentation/web-api/tutorials/getting-started#request-an-access-token
//no inputs
//Returns a token json. In the token json, "token.access_token" is what we will 
//pass to future functions in order to query the API. 
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
                    'Authorization': 'Basic ' + (btoa(client_id + ':' + client_secret)),
                },
            });
            return await response.json();
        } catch(error) {
            console.error(error);
            throw error;
        }
        
    }


//getArtistId uses the artist name to search for the artist ID, which we will need
//in order to get similar artists
async function getArtistId(artistName, access_token) {
    // const accessToken = await getToken();
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
        console.log(data.artists.items[0].id);
        console.log(data.artists.items[0].name);
        return data.artists.items[0].id;
        
    } catch (error) {
        console.error('error searching for artist',error);
        throw error;
    }
    
}
    
// getRecommendations takes the artistId and the access token as parameters,
//and returns an array of similar artists
//documentation: https://developer.spotify.com/documentation/web-api/reference/get-recommendations
async function getRecommendations(artistId, access_token) {
  
    try {

    //seed_artists: A comma separated list of Spotify IDs for seed artists. Up to 5 seed values may be provide
    const seed_artist = artistId + ","; //format of artist Id has a comma at the end, in case we want to add more artist seeds

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
    
    console.log('Recommended Artists:', artists); //needs to be modified to write to DOM instead of console log

  } catch (error) {
    console.error('Error fetching recommendations:', error.message);
    throw error;
  }}

//(code I wrote ends here)

    function showSuggestions(artistName) {
        if (artistName.length === 0) {
            document.getElementById('suggestions').innerHTML = '';
            return;
        }

        // Make API call to fetch suggestions
        const apiFetchLink = `https://app.ticketmaster.com/discovery/v2/suggest?apikey=NRNGP7p9IHnBQvw0ip9rH6d5W7gxbimk&keyword=${artistName}`;
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
                            runProgram();
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

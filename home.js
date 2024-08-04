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

    async function runProgram() {
        const artistName = searchBar.value;
        if (artistName.length === 0) {
            return;
        }
        
        try {
            const token = await getToken();
            const artistId = await getArtistId(artistName, token.access_token);
            
            // Redirect to artist.html with the artist name as a URL parameter
            window.location.href = `artist.html?artist=${encodeURIComponent(artistName)}&id=${artistId}`;
        } catch (error) {
            console.error("Error: ", error);
        }
    }

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
                    'Authorization': 'Basic ' + btoa(client_id + ':' + client_secret),
                },
            });
            return await response.json();
        } catch(error) {
            console.error(error);
            throw error;
        }
    }

    async function getArtistId(artistName, access_token) {
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
            return data.artists.items[0].id;
        } catch (error) {
            console.error('error searching for artist',error);
            throw error;
        }
    }
    
    function showSuggestions(artistName) {
        if (artistName.length === 0) {
            document.getElementById('suggestions').innerHTML = '';
            return;
        }

        const apiFetchLink = `https://app.ticketmaster.com/discovery/v2/suggest?apikey=NRNGP7p9IHnBQvw0ip9rH6d5W7gxbimk&keyword=${artistName}`;
        fetch(apiFetchLink, { method: 'GET' })
            .then(response => response.json())
            .then(data => {
                if (data && data._embedded && data._embedded.attractions) {
                    const suggestions = data._embedded.attractions.map(attraction => `
                        <div class="suggestion-item" data-value="${attraction.name}">${attraction.name}</div>
                    `).join('');
                    document.getElementById('suggestions').innerHTML = suggestions;

                    document.querySelectorAll('.suggestion-item').forEach(item => {
                        item.addEventListener('click', function () {
                            const value = this.getAttribute('data-value');
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

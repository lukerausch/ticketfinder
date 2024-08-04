document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const artistName = params.get('artist');
    const artistId = params.get('id');
    
    if (artistName && artistId) {
        (async function() {
            try {
                const token = await getToken();
                await displayArtistInfo(artistId, token.access_token);
                await displayTopTracks(artistId, token.access_token);
                
                // Auto-fill the artist input field
                document.getElementById('artist-input').value = artistName;
                
                // Add event listener for form submission
                document.getElementById('submit-artists').addEventListener('click', async () => {
                    const artists = Array.from(document.querySelectorAll('#related-artists-form input'))
                        .map(input => input.value.trim())
                        .filter(value => value.length > 0)
                        .slice(0, 5);

                    const relatedArtists = await getRelatedArtists(artists, token.access_token);
                    displayRelatedArtists(relatedArtists);
                    const relatedSongs = await getRelatedSongs(relatedArtists, token.access_token);
                    displayRelatedSongs(relatedSongs);
                });
                
            } catch (error) {
                console.error("Error: ", error);
            }
        })();
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

    async function displayArtistInfo(artistId, access_token) {
        const endpoint = `https://api.spotify.com/v1/artists/${artistId}`;
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });
            if (!response.ok) {
                throw new Error('Could not fetch artist info');
            }
            const data = await response.json();
            
            const artistInfoDiv = document.getElementById('artist-name');
            artistInfoDiv.innerHTML = `
                <h2>${data.name}</h2>
                <img id="artist-image" src="${data.images[0].url}" alt="${data.name}" width="300" height="300">
                <p id="artist-genres">Genres: ${data.genres.join(', ')}</p>
                <p id="artist-followers">Followers: ${data.followers.total}</p>
            `;
        } catch (error) {
            console.error('Error fetching artist info:', error.message);
        }
    }

    async function displayTopTracks(artistId, access_token) {
        const endpoint = `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`;
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });
            if (!response.ok) {
                throw new Error('Could not fetch top tracks');
            }
            const data = await response.json();
            
            const topTracksDiv = document.getElementById('top-songs');
            topTracksDiv.innerHTML = '<h2>Top Tracks</h2>';
            data.tracks.forEach(track => {
                topTracksDiv.innerHTML += `
                    <div class="song-item">
                        <p><strong>${track.name}</strong></p>
                        <p>Album: ${track.album.name}</p>
                        <img src="${track.album.images[0].url}" alt="${track.name}" style="width: 100px; height: 100px; object-fit: cover;">
                    </div>
                `;
            });
        } catch (error) {
            console.error('Error fetching top tracks:', error.message);
        }
    }

    async function getRelatedArtists(artists, access_token) {
        const relatedArtists = new Set();
        
        for (const artist of artists) {
            const artistId = await getArtistId(artist, access_token);
            if (!artistId) continue;
            
            const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/related-artists`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });
            const data = await response.json();
            
            data.artists.forEach(artist => relatedArtists.add(artist.id));
            if (relatedArtists.size >= 20) break; // Stop if we have 20 unique artists
        }

        return Array.from(relatedArtists).slice(0, 20);
    }

    async function getArtistId(artistName, access_token) {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });
        const data = await response.json();
        return data.artists.items[0]?.id;
    }

    async function getRelatedSongs(relatedArtists, access_token) {
        const allSongs = [];
        
        for (const artistId of relatedArtists) {
            const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });
            const data = await response.json();
            
            allSongs.push(...data.tracks.slice(0, 2));
        }

        return allSongs;
    }

    function displayRelatedArtists(artists) {
        const relatedArtistsList = document.getElementById('related-artists-list');
        
        relatedArtistsList.innerHTML = artists.map(id => `
            <div>Artist ID: ${id}</div>
        `).join('');
    }

    function displayRelatedSongs(songs) {
        const relatedSongs = document.getElementById('related-songs');
        
        relatedSongs.innerHTML = songs.map(track => `
            <div>
                <div><strong>${track.name}</strong></div>
                <div>Album: ${track.album.name}</div>
                <img src="${track.album.images[0].url}" alt="${track.name}" style="width: 100px; height: 100px; object-fit: cover;">
            </div>
        `).join('');
    }
});

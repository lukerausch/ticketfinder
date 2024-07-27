function showSuggestions(query) {
    if (query.length === 0) {
        document.getElementById('suggestions').innerHTML = '';
        return;
    }

    fetch(`getSuggestions.php?query=${query}`)
        .then(response => response.text()) // Get response as text
        .then(text => {
            try {
                const data = JSON.parse(text); // Attempt to parse JSON
                let suggestions = data.map(item => `<div class="suggestion-item" onclick="selectSuggestion('${item}')">${item}</div>`).join('');
                document.getElementById('suggestions').innerHTML = suggestions;
            } catch (error) {
                console.error('Error parsing JSON:', error);
                console.log('Response:', text); // Log the raw response for debugging
                document.getElementById('suggestions').innerHTML = `<div class="error">Invalid JSON response.</div>`;
            }
        })
        .catch(error => {
            console.error('Error fetching suggestions:', error);
            document.getElementById('suggestions').innerHTML = `<div class="error">${error.message}</div>`;
        });
}

function selectSuggestion(suggestion) {
    document.getElementById('search-bar').value = suggestion;
    document.getElementById('suggestions').innerHTML = '';
}

function searchEvents() {
    const query = document.getElementById('search-bar').value;
    if (query.length === 0) {
        return;
    }

    // Move the search container to the top
    document.getElementById('search-container').classList.add('move-up');

    // Make API call to fetch events
    fetch(`https://real-time-events-search.p.rapidapi.com/search-events?query=${query}&date=any&is_virtual=false&start=0`, {
        method: 'GET',
        headers: {
            'X-Rapidapi-Key': 'ffb663c32dmsh8077ef8402cddc7p175900jsnb8370c2edbf9',
            'X-Rapidapi-Host': 'real-time-events-search.p.rapidapi.com'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('API Response:', data); // Log the entire response for debugging

        if (!data || !data.data) {
            throw new Error('API response does not contain data');
        }

        const filteredEvents = data.data.filter(event => {
            const tags = event.tags || []; // Ensure tags exist
            return tags.some(tag => ["music", "show", "concert"].includes(tag.toLowerCase()));
        });

        // Generate the HTML for each event
        let events = filteredEvents.map(event => `
            <div class="event-item">
                <div class="event-details">
                    <h3>${event.name}</h3>
                    <div>${event.start_time}</div>
                    <div>${event.venue ? event.venue.name : 'Unknown Venue'}</div>
                </div>
            </div>
        `).join('');

        // Insert the events HTML into the page
        document.getElementById('events').innerHTML = events;
    })
    .catch(error => {
        console.error('Error fetching events:', error);
        document.getElementById('events').innerHTML = `<div class="error">${error.message}</div>`;
    });
}

document.getElementById('search-button').addEventListener('click', searchEvents);
document.getElementById('search-bar').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        searchEvents();
    }
});

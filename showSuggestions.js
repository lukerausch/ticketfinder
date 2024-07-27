document.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.getElementById('search-bar');
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
            } else {
                searchEvents();
            }
        }
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
});

function showSuggestions(query) {
    if (query.length === 0) {
        document.getElementById('suggestions').innerHTML = '';
        return;
    }

    fetch(`getSuggestions.php?query=${query}`)
        .then(response => response.text())
        .then(text => {
            try {
                const data = JSON.parse(text);
                let suggestions = data.map(item => `
                    <div class="suggestion-item" data-value="${item}">${item}</div>
                `).join('');
                document.getElementById('suggestions').innerHTML = suggestions;

                // Add click event listeners to each suggestion item
                document.querySelectorAll('.suggestion-item').forEach(item => {
                    item.addEventListener('click', function() {
                        const value = this.getAttribute('data-value');
                        document.getElementById('search-bar').value = value;
                        document.getElementById('suggestions').innerHTML = '';
                        searchEvents();
                    });
                });

            } catch (error) {
                console.error('Error parsing JSON:', error);
                console.log('Response:', text);
                document.getElementById('suggestions').innerHTML = `<div class="error">Invalid JSON response.</div>`;
            }
        })
        .catch(error => {
            console.error('Error fetching suggestions:', error);
            document.getElementById('suggestions').innerHTML = `<div class="error">${error.message}</div>`;
        });
}

function searchEvents() {
    const query = document.getElementById('search-bar').value;
    if (query.length === 0) {
        return;
    }

    document.getElementById('search-container').classList.add('move-up');

    fetch(`https://real-time-events-search.p.rapidapi.com/search-events?query=${query}&date=any&is_virtual=false&start=0`, {
        method: 'GET',
        headers: {
            'X-Rapidapi-Key': 'ffb663c32dmsh8077ef8402cddc7p175900jsnb8370c2edbf9',
            'X-Rapidapi-Host': 'real-time-events-search.p.rapidapi.com'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('API Response:', data);

        if (!data || !data.data) {
            throw new Error('API response does not contain data');
        }

        const filteredEvents = data.data.filter(event => {
            const tags = event.tags || [];
            return tags.some(tag => ["music", "show", "concert"].includes(tag.toLowerCase()));
        });

        let events = filteredEvents.map(event => `
            <div class="event-item">
                <div class="event-details">
                    <h3>${event.name}</h3>
                    <div>${event.start_time}</div>
                    <div>${event.venue ? event.venue.name : 'Unknown Venue'}</div>
                </div>
                <a href="${event.link}" target="_blank">More details</a>
            </div>
        `).join('');

        document.getElementById('events').innerHTML = events;
    })
    .catch(error => {
        console.error('Error fetching events:', error);
        document.getElementById('events').innerHTML = `<div class="error">${error.message}</div>`;
    });
}

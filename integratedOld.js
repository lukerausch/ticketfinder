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

        // Highlight the search button briefly
        searchButton.classList.add('highlight');
        setTimeout(() => {
            searchButton.classList.remove('highlight');
        }, 500);

        // Remove header and search bar
        document.querySelector('header').style.display = 'none';
        document.getElementById('search-container').style.display = 'none';
        document.getElementById('suggestions').style.display = 'none';

        // Make API call to fetch events
        const apiFetchLink = `https://app.ticketmaster.com/discovery/v2/events.json?keyword=${query}&apikey=NRNGP7p9IHnBQvw0ip9rH6d5W7gxbimk`;
        fetch(apiFetchLink, { method: 'GET' })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                // Check if _embedded exists and contains events
                if (data && data._embedded && data._embedded.events) {
                    const events = data._embedded.events;

                    const resultsDiv = document.getElementById('results');
                    resultsDiv.innerHTML = `<h2>Results for "${query}"</h2>`; // Clear previous results and add heading

                    for (let i = 0; i < events.length; i++) {
                        console.log(i);

                        const currEvent = events[i];

                        if (currEvent.dates.start.localDate && currEvent.priceRanges != undefined && currEvent.url != undefined) {
                            const date = currEvent.dates.start.localDate;
                            const lowestPrice = currEvent.priceRanges[0].min;
                            const url = currEvent.url;

                            const eventDiv = document.createElement('div');
                            eventDiv.classList.add('event-item');

                            eventDiv.innerHTML = `
                                <div class="event-details">
                                    <div class="event-date">${date}</div>
                                    <div class="event-price">$${lowestPrice}</div>
                                    <div class="event-link"><a href="${url}">Buy tickets</a></div>
                                </div>
                            `;

                            resultsDiv.appendChild(eventDiv);
                        }
                    }

                    console.log('Events:', events);
                } else {
                    console.error('Error: _embedded.events is missing in the response');
                }
            })
            .catch(error => console.error('Error:', error));
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

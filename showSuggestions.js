function showSuggestions(query) {
    if (query.length === 0) {
        document.getElementById('suggestions').innerHTML = '';
        return;
    }

    fetch(`/search?query=${query}`)
        .then(response => response.json())
        .then(data => {
            let suggestions = data.map(item => `<div class="suggestion-item">${item}</div>`).join('');
            document.getElementById('suggestions').innerHTML = suggestions;
        })
        .catch(error => console.error('Error fetching suggestions:', error));
}
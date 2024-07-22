const express = require('express');
const app = express();
const port = process.env.PORT
const bodyParser = require('body-parser');
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'ticketfinder'
});

connection.connect(err => {
    if (err) throw err;
    console.log('Connected to the database!');
});

app.use(bodyParser.json());

app.get('/search', (req, res) => {
    const query = req.query.query;
    console.log(`Received search query: ${query}`);  // Log the query received

    if (!query) {
        res.status(400).json({ error: 'Query parameter is missing' });
        return;
    }

    connection.query(
        'SELECT name FROM artists WHERE name LIKE ?',
        [`%${query}%`],
        (error, results) => {
            if (error) {
                console.error('Database query error:', error);  // Log any database errors
                res.status(500).json({ error: 'Database query error' });
                return;
            }
            console.log('Database query results:', results);  // Log the results from the database
            res.json(results.map(row => row.name));
        }
    );
});

app.use((req, res, next) => {
    res.status(404).send('<h1>404 Not Found</h1>');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

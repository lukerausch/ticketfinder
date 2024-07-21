const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'ticketadmin',
    password: '123ticketadmin123',
    database: 'dbhfc20ivr8f3y'
});

connection.connect(err => {
    if (err) throw err;
    console.log('Connected to the database!');
});

app.use(bodyParser.json());

app.get('/search', (req, res) => {
    const query = req.query.query;
    connection.query(
        'SELECT name FROM artists WHERE name LIKE ?',
        [`%${query}%`],
        (error, results) => {
            if (error) throw error;
            res.json(results.map(row => row.name));
        }
    );
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
// Main server file

const express = require('express'); // Import Express
const app = express(); // Create an Express application

// Create a response when visiting homepage
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Set up the server to listen on port 3000
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

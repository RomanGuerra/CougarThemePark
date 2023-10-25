// This file is the main server file for the web application

// Using Express framework for Node.js
const express = require('express');
const app = express();
const port = 3000;

// Serve static files
app.use(express.static(__dirname));

// Start the listening on specified port
console.log(__dirname)
app.listen(port, () => {
    console.log(`Web app listening at http://localhost:${port}`)
  });
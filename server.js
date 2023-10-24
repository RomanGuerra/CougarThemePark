// Express framework for Node.js
const express = require('express')
const app = express()
const port = 3000

// Serve static files
app.use(express.static('public'))

// Start the Express app
app.listen(port, () => {
    console.log(`Web app listening at http://localhost:${port}`)
  })
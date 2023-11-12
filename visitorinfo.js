const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
const port = 5500;

// Use the cors middleware with specific options to allow requests from the client origin
app.use(cors({ origin: 'http://127.0.0.1:5500' }));

// Database configuration
const config = {
  server: '64.227.100.29',
  authentication: {
    type: 'default',
    options: {
      userName: 'sa',
      password: 'Umacosc3380!',
    },
  },
  options: {
    encrypt: true, // Required for Azure SQL
    database: 'CougarThemeParkBackUp',
  },
};

// Connect to the database
sql.connect(config, (err) => {
  if (err) {
    console.error('Database connection error:', err);
    return;
  }
  console.log('Connected to the database');
});

// Define a route to retrieve visitor data
app.get('/getVisitorData', (req, res) => {
  const query = 'SELECT * FROM VISITOR';
  sql.query(query, (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      res.status(500).json({ error: 'An error occurred' });
      return;
    }
    res.json(result.recordset);
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const sql = require('mssql');
const express = require('express');
const cors = require('cors');


const app = express();

// Use the cors middleware with specific options to allow requests from the client origin
app.use(cors({ origin: 'http://127.0.0.1:5500' }));

const config = {
  user: 'team8',
  password: 'UHcougar8',
  server: 'cougar-park.database.windows.net',
  database: 'Cougar Theme Park',
  options: {
    encrypt: true, // Required for Azure SQL
  },
};

app.get('/getVisitorCount', async (req, res) => {
  try {
    // Connect to the database
    await sql.connect(config);

    // Query the visitor count
    const result = await sql.query('SELECT COUNT(ISNULL(visitor_ID, 0)) AS total_count FROM VISITOR');

    // Close the connection
    await sql.close();

    // Send the visitor count as JSON response
    const visitorCount = result.recordset.map(record => record.visitor_ID);
    res.json({ visitorCount: result.recordset[0].total_count });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving visitor count.');
  }
});

app.listen(5500, () => {
  console.log('Server is running on port 5500');
});

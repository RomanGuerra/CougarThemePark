const sql = require('mssql');
const fs = require('fs');

// Database configuration
const config = {
  server: 'cougar-park.database.windows.net',
  authentication: {
    type: 'default',
    options: {
      userName: 'team8',
      password: 'UHcougar8',
    },
  },
  options: {
    encrypt: true, // Required for Azure SQL
    database: 'Cougar Theme Park',
  },
};

// Connect to the database
sql.connect(config, (err) => {
  if (err) {
    console.error('Database connection error:', err);
    return;
  }
  console.log('Connected to the database');

  // Define a query to retrieve visitor data
  const query = 'SELECT * FROM VISITOR';

  // Execute the query
  sql.query(query, (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      sql.close();
      return;
    }

    // Transform the result to JSON
    const jsonData = result.recordset;

    // Write the JSON data to a file
    fs.writeFileSync('visitorData.json', JSON.stringify(jsonData, null, 2));

    console.log('Data saved to visitorData.json');
    sql.close();
  });
});

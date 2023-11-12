// This file is the main server file for the web application
const fs = require('fs');

// Using Express framework for Node.js
const express = require('express');
const app = express();
const port = 5500;

const bodyParser = require('body-parser');

var Connection = require('tedious').Connection;  
var config = {  
    server: '64.227.100.29',  //update me
    authentication: {
        type: 'default',
        options: {
            userName: 'sa', //update me
            password: 'Umacosc3380!'  //update me
        }
    },
    options: {
        // If you are on Microsoft Azure, you need encryption:
        encrypt: true,
        trustServerCertificate: true,
        database: 'CougarThemeParkBackUp'  //update me
    }
};  

var connection = new Connection(config);  
connection.on('connect', function(err) {  
    // If no error, then good to proceed.  
    if (!err) {
      console.log("Connected");  
    } else {
      console.log(err);
    }
});  

connection.connect();

var Request = require('tedious').Request;  
var TYPES = require('tedious').TYPES;  

function executeStatement(sql, callback) {  
    var request = new Request(sql, (e, r, row) => {});

    _rows = [];

    request.on("row", columns => {
      var _item = {};
      for (var name in columns) {
        _item[name] = columns[name].value;
      }
      _rows.push(_item);
    });

    request.on("doneProc", (rowCount, more, rows) => {
      callback(_rows);
    });

    connection.execSql(request);
}

// Serve static files
app.use(express.static(__dirname));

app.get("/api/employees", (req, res) => {
  console.log("GET api/employees");
  const sql_call = "SELECT * FROM EMPLOYEE;"
  executeStatement(sql_call, (rows) => {
    res.json(rows);
  });
});

app.get("/api/ride-count", (req, res) => {
  console.log("GET api/ride-count");

  // `SELECT RIDE.ride_name, B.ride_ID, B.ride_count, RIDE.p_location FROM (
  //   SELECT ride_ID, COUNT(*) AS ride_count FROM dbo.RIDE_OPERATION
  //   WHERE YEAR(date) = ${req.query.year}
  //   GROUP BY ride_ID
  // ) AS B
  // INNER JOIN RIDE ON RIDE.ride_ID = B.ride_ID
  // ORDER BY ride_count ASC;
  // `

  var sql_call = `SELECT RIDE.ride_name, B.ride_ID, B.ride_count, RIDE.p_location FROM (
    SELECT ride_ID, COUNT(*) AS ride_count FROM dbo.RIDE_OPERATION
  `
  if (req.query.month == 0) {
    sql_call += `WHERE YEAR(date) = ${req.query.year}`
  } else {
    sql_call += `WHERE YEAR(date) = ${req.query.year} AND MONTH(date) = ${req.query.month}`
  }
  sql_call += `
      GROUP BY ride_ID
    ) AS B
    INNER JOIN RIDE ON RIDE.ride_ID = B.ride_ID
  `;

  if (req.query.order === "ride_op_dsc") {
    sql_call += "ORDER BY ride_count DESC";
  }
  if (req.query.order === "ride_op_asc") {
    sql_call += "ORDER BY ride_count ASC"
  }
  sql_call += ";";

  executeStatement(sql_call, (rows) => {
    res.json(rows);
  })
})

app.get("/api/rainout-count", (req, res) => {
  console.log("GET api/rainout-count");

  // SELECT MONTH(date) as month, COUNT(*) as rainout_count FROM RAINOUT
  // WHERE YEAR(date) = ${sql.query.year}
  // GROUP BY MONTH(date)
  // ORDER BY rainout_count ASC;

  var sql_call = `
    SELECT MONTH(date) as month, COUNT(*) as rainout_count FROM RAINOUT
    WHERE YEAR(date) = ${req.query.year}
    GROUP BY MONTH(date)
  `
  if (req.query.order === "month_asc") {
    sql_call += "ORDER BY month ASC";
  }
  if (req.query.order === "month_dsc") {
    sql_call += "ORDER BY month DESC"
  }
  if (req.query.order === "rainout_asc") {
    sql_call += "ORDER BY rainout_count DESC";
  }
  if (req.query.order === "rainout_dsc") {
    sql_call += "ORDER BY rainout_count ASC"
  }
  sql_call += ";";

  executeStatement(sql_call, (rows) => {
    res.json(rows);
  })
})

app.use(bodyParser.json());

app.get("/api/visitors", (req, res) => {
  console.log("GET api/visitors");
  const sql_call = "SELECT * FROM VISITOR;";
  executeStatement(sql_call, (rows) => {
    console.log(rows);
    res.json(rows);
  });
});

app.get("/api/visitorsCount", (req, res) => {
  console.log("GET api/visitorsCount");
  const sql_call = "SELECT COUNT(*) FROM VISITOR;";
  executeStatement(sql_call, (rows) => {
    console.log(rows);
    res.json(rows);
  });
});


app.post("/api/add-visitor", (req, res) => {
  console.log("POST /api/add-visitor");

  const { fname, lname, phone, ename, age, tickettype } = req.body;
  console.log('Executing SQL');
  
  const visitorID = Math.floor(Math.random() * 2147483647); // Generate a random bigint
  const wristbandID = Math.floor(Math.random() * 2147483647); // Generate a random bigint
  const request = new Request(
      `INSERT INTO VISITOR (visitor_ID, wristband_ID, first_name, last_name, contact_information, emergency_contact, age, ticket_type)
       VALUES (@visitorID, @wristbandID, @fname, @lname, @phone, @ename, @age, @tickettype);
       SELECT SCOPE_IDENTITY() AS VisitorID;`,
      (err) => {
          if (err) {
              console.error('SQL Query Error:', err);
          }
      }
  );
    request.addParameter('visitorID', TYPES.BigInt, visitorID);
    request.addParameter('wristbandID', TYPES.BigInt, wristbandID);
    request.addParameter('fname', TYPES.NVarChar, fname);
    request.addParameter('lname', TYPES.NVarChar, lname);
    request.addParameter('phone', TYPES.BigInt, phone);
    request.addParameter('ename', TYPES.BigInt, ename);
    request.addParameter('age', TYPES.TinyInt, age);
    request.addParameter('tickettype', TYPES.TinyInt, tickettype);
    request.on('row', function (columns) {
        columns.forEach(function (column) {
            if (column.value === null) {
                console.log('NULL');
                res.status(200).json({ visitorID: column.value });
            } else {
                //console.log('Visitor ID of inserted item is ' + column.value);
                res.status(200).json({ visitorID: column.value });
            }
        });
    });

  // Close the connection after the final event emitted by the request, after the callback passes
  request.on('requestCompleted', function (rowCount, more) {
      //connection.close();
  });
  connection.execSql(request);
});

// sql works 

app.get("/api/visitor-report", (req, res) => {
  console.log("GET api/visitor-report");

  // SQL query to retrieve visitor ticket types by first name, last name, and age
  const ticketType = req.query.ticket;
  console.log(req.query.ticket);
  var sql_call = `
    SELECT first_name, last_name, age
    FROM VISITOR
    WHERE ticket_type = ${req.query.ticket}
  `;

  //sql_call += ticketType;
  // i think this shoudl work
  // i'll send you the statement later...
  // leaving WHERE ticket_type = empty should be good?
  // I really appreciate the help, now I can start the homepage
  // alright bro, thanks for lookin out
  // glad to help, let me know if you need anything else. I'll be up for a bit longer.
  // Add ordering based on the request query parameter
  if (req.query.order === "first_name_asc") {
    sql_call += " ORDER BY first_name ASC";
  }
  if (req.query.order === "first_name_dsc") {
    sql_call += " ORDER BY first_name DESC";
  }
  if (req.query.order === "last_name_asc") {
    sql_call += " ORDER BY last_name ASC";
  }
  if (req.query.order === "last_name_dsc") {
    sql_call += " ORDER BY last_name DESC";
  }
  sql_call += ";";

  executeStatement(sql_call, (rows) => {
    res.json(rows);
  });
});


// Start the listening on specified port
console.log(__dirname)
app.listen(port, () => {
    console.log(`Web app listening at http://localhost:${port}`)
});
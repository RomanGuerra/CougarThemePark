// This file is the main server file for the web application
const fs = require('fs');

// Using Express framework for Node.js
const express = require('express');
const app = express();
const port = 3000;

var Connection = require('tedious').Connection;  
var config = {  
    server: 'cougar-park.database.windows.net',  //update me
    authentication: {
        type: 'default',
        options: {
            userName: 'team8', //update me
            password: 'UHcougar8'  //update me
        }
    },
    options: {
        // If you are on Microsoft Azure, you need encryption:
        encrypt: true,
        database: 'Cougar Theme Park'  //update me
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
  console.log("api/employees hit");
  const sql_call = "SELECT * FROM EMPLOYEE;"
  executeStatement(sql_call, (rows) => {
    res.json(rows);
  });
});

// Start the listening on specified port
console.log(__dirname)
app.listen(port, () => {
    console.log(`Web app listening at http://localhost:${port}`)
});
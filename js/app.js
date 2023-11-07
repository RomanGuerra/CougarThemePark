// Libraries
const express = require('express');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

// Users Array
const users = [];

// Serve static files
app.use(express.static(__dirname));
app.use(express.json());

// Get Users
app.get('/users', (req, res) => {
    res.json(users);
});

// Add User
app.post('/users', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        console.log(salt);
        console.log(hashedPassword);
        const user = { name: req.body.name, password: hashedPassword };
        users.push(user);
        res.status(201).send();
    } catch {
        res.status(500).send();
    }
});


// Loging User
app.post('/users/login', async (req, res) => {
    const user = users.find(user => user.name === req.body.name);
    console.log(req.body.name);
    if (user == null) {
        return res.status(400).send('Cannot find user');
    }
    try {
        if (await bcrypt.compare(req.body.password, user.password)) {
            res.send("Login Success");
            console.log(req.body.password);
            console.log(user.password);
        } else {
            res.send("Login Not Allowed");
            console.log(req.body.password);
            console.log(user.password);
        }
    } catch {
        res.status(500).send();
    }
});
 

// Start the listening on specified port
app.listen(port, () => {
    console.log(`Web app listening at http://localhost:${port}`)
});

// SQL TEST
var Connection = require('tedious').Connection;
var config = {  
    server: 'ctp-users.database.windows.net',  //update me
    authentication: {
        type: 'default',
        options: {
            userName: 'admincoug', //update me
            password: 'UHcougar1'  //update me
        }
    },
    options: {
        // If you are on Microsoft Azure, you need encryption:
        encrypt: true,
        database: 'COUGARS'  //update me
    }
};  



var connection = new Connection(config);  
    connection.on('connect', function(err) {  
        // If no error, then good to proceed.  
        console.log("Connected");  
        executeStatement();  
    });  
    
    connection.connect();
  
    var Request = require('tedious').Request;  
    var TYPES = require('tedious').TYPES;  
  
    function executeStatement() {  
        var request = new Request("SELECT * FROM [dbo].[USERS];", function(err) {  
        if (err) {  
            console.log(err);}  
        });  
        var result = "";  
        request.on('row', function(columns) {  
            columns.forEach(function(column) {  
              if (column.value === null) {  
                console.log('NULL');  
              } else {  
                result+= column.value + " ";  
              }  
            });  
            console.log(result);  
            result ="";  
        });  
  
        request.on('done', function(rowCount, more) {  
        console.log(rowCount + ' rows returned');  
        });  
        
        // Close the connection after the final event emitted by the request, after the callback passes
        request.on("requestCompleted", function (rowCount, more) {
            connection.close();
        });
        connection.execSql(request);  
    } 
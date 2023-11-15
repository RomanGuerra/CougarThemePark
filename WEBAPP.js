// This file is the main server file for the web application
const fs = require('fs');

// Using Express framework for Node.js
const express = require('express');
const app = express();
const port = 5500;

const bodyParser = require('body-parser');
const path = require('path');

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
        encrypt: true,
        trustServerCertificate: true,
        database: 'CougarThemeParkBackUp'  //update me
    }
};

var connection = new Connection(config);  
connection.on('connect', function(err) {  
    if (!err) {
      console.log("Connected");  
    } else {
      console.log(err);
    }
});  

connection.connect();


const mssql = require('mssql');
async function connectMssql() {
  try {
    await mssql.connect('Server=64.227.100.29,1433;Database=CougarThemeParkBackUp;User Id=sa;Password=Umacosc3380!;Encrypt=true;TrustServerCertificate=True;')
    console.log("mssql connected to server");
  } catch(err) {
    
  }
}
connectMssql();

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

// passport.js
app.use(require('body-parser').urlencoded({ extended: true }));

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true }
}));

passport.serializeUser(function(user, cb) {
  return cb(null, {
    username: user,
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

async function verifyVisitorUser(username, password) {
  var sql_query = `
    SELECT *  FROM VISITOR_USER
    WHERE username = '${username}' AND password = '${password}';
  `;
  const res = await mssql.query(sql_query);
  return res.rowsAffected > 0;
};

async function verifyEmployeeUser(username, password) {
  var sql_query = `
    SELECT *  FROM EMPLOYEE_USER
    WHERE username = '${username}' AND password = '${password}';
  `;
  const res = await mssql.query(sql_query);
  return res.rowsAffected > 0;
};

// visitor login
passport.use('visitor-local-login', new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password'
    }, 
    async function (username, password, done) {
      var res = await verifyVisitorUser(username, password);
      if (res) {
        console.log("success login");
        return done(null, username);
      }
      return done(null, false, {message: 'Incorrect email or password.'});
    }
));

passport.use('employee-local-login', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
}, 
async function (username, password, done) {
  var res = await verifyEmployeeUser(username, password);
  console.log(res);
  if (res) {
    console.log("success login");
    return done(null, username);
  }
  return done(null, false, {message: 'Incorrect email or password.'});
}
));

app.use(passport.session());

// Serve static files
app.use('*/css', express.static(path.join(__dirname, 'public/css')));
app.use('*/img', express.static(path.join(__dirname, 'public/img')));
app.use('*/js', express.static(path.join(__dirname, 'public/js')));
app.use(express.static(path.join(__dirname, 'routes')));

app.post("/api/visitor-logout", function(req, res, next) {
  req.logOut(function(err) {
    if (err) { return next(err) }
      res.redirect('/');
    })
})

app.post("/api/visitor-login", passport.authenticate('visitor-local-login', {
  failureRedirect: '/login.html'
}), function (req, res, next) {
  // console.log(req.user)
  res.redirect("/visitor/dashboard.html");
});

app.post("/api/employee-logout", function(req, res, next) {
  req.logOut(function(err) {
    if (err) { return next(err) }
      res.redirect('login.html');
    })
})

app.post("/api/employee-login", passport.authenticate('employee-local-login', {
  failureRedirect: '/all/employee-login.html'
}), async function (req, res, next) {

  result = await mssql.query(`
    SELECT is_admin FROM EMPLOYEE_USER WHERE username = '${req.body.username}';
  `)
  console.log(result.recordsets[0]);
  if (result.recordsets[0][0]["is_admin"]) {
    res.redirect("/admin/dashboard.html");
  } else {
    res.redirect("/employee/dashboard.html");
  }

});

app.post("/api/create-visitor-account", async function (req, res, next) {
  const visitorID = Math.floor(Math.random() * 2147483647); // Generate a random bigint
  const wristbandID = Math.floor(Math.random() * 2147483647); // Generate a random bigint

  try {
    console.log("visitor table");
    await mssql.query(`
      INSERT INTO VISITOR 
        (visitor_ID, wristband_ID, first_name, last_name, contact_information, emergency_contact, age, ticket_type)
      VALUES 
        (${visitorID}, ${wristbandID}, '${req.body.firstname}', '${req.body.lastname}', ${req.body.phonenumber}, ${req.body.ephonenumber}, ${req.body.age}, ${0});`)
  
    console.log("visitor-user table");
    await mssql.query(`
      INSERT INTO VISITOR_USER 
        (visitor_ID, username, password)
      VALUES 
        (${visitorID}, '${req.body.username}', '${req.body.password}');`);

    req.logIn(req.body.username, function(err) {
      if (err) { return next(err); }
      res.redirect("/visitor/dashboard.html");
    })
  }  catch (err) {
    res.status(400);
  }
});

// api calls
app.get("/api/ride-information", (req, res) => {
  var sql_query = `
    SELECT 
      RIDE.ride_ID, RIDE.ride_name, RIDE_INFORMATION.ride_image_url, RIDE_INFORMATION.ride_long_desc
    FROM 
      RIDE
    LEFT OUTER JOIN RIDE_INFORMATION 
      ON RIDE.ride_id = RIDE_INFORMATION.ride_id;
  `;
  executeStatement(sql_query, (rows) => {
    res.json(rows);
  })
});

app.get("/api/maintenence-log", (req, res) => {
  var data = req.query;
  var sql_query_get_ride_id = `SELECT ride_id FROM RIDE WHERE ride_name = ${data.rideName}`

  executeStatement(sql_query_get_ride_id, (rows) => {
    var sql_query = `INSERT INTO MAINTENENCE_LOG (ride_ID, employee_ID, date, work_p_description)
    VALUES(${rows[0]["ride_id"]}, ${data.employee}), ${data.date}, ${data.work_p_description});`

    executeStatement(sql_query, (log) => {

    })
  })
})

app.get("/api/employees", (req, res) => {
  console.log("GET api/employees");
  const sql_call = "SELECT * FROM EMPLOYEE;"
  executeStatement(sql_call, (rows) => {
    res.json(rows);
  });
});

app.get("/api/ride-count/year", (req, res) => {
  console.log("GET /api/ride-count/year");
  var year = (req.query.year.split(" ")).pop()
  where_clause = `WHERE YEAR(date) = ${year}`;

  var top_clause = ``;
  var order_by_clause = ``;
  if (req.query.filter == "Filter By: Top 10 Rider Count") {
    top_clause = `TOP 10`;
    order_by_clause = `ORDER BY w.visitor_count DESC`;
  } else if (req.query.filter == "Filter By: Bottom 10 Rider Count") {
    top_clause = `TOP 10`;
    order_by_clause = `ORDER BY w.visitor_count ASC`;
  } else if (req.query.filter == "Filter By: Top 10 Operation Count") {
    top_clause = `TOP 10`;
    order_by_clause = `ORDER BY ride_operations_count DESC`;
  } else if (req.query.filter == "Filter By: Bottom 10 Operation Count") {
    top_clause = `TOP 10`;
    order_by_clause = `ORDER BY ride_operations_count ASC`;
  }

  var ride_statistics_query = `
    SELECT ${top_clause}
      w.ride_ID,
      RIDE.ride_name,
      w.visitor_count,
      ride_operations_count
    FROM
      (
      SELECT
        R.ride_ID,
        P.visitor_count,
        R.operation_count as ride_operations_count
      FROM
        (
        SELECT
          Z.ride_ID,
          COUNT(Z.ride_ID) as operation_count
        FROM
          RIDE_OPERATION AS Z
        ${where_clause}
        GROUP BY
          Z.ride_ID
    ) as R
      LEFT OUTER JOIN (
        SELECT
          Q.ride_ID ,
          COUNT(V.vistor_id) as visitor_count
        FROM
          RIDE_OPERATION as Q
        LEFT OUTER JOIN Visitor_event as V
        ON
          V.events_id = Q.event_ID
        ${where_clause}
        GROUP BY
          Q.ride_ID
    ) as P
    ON
        P.ride_ID = R.ride_ID
    ) as w
    LEFT OUTER JOIN RIDE
    on
      RIDE.ride_ID = w.ride_ID
    ${order_by_clause};
  `

  executeStatement(ride_statistics_query, (ride_stat_rows) => {
    res.json(ride_stat_rows);
  })
})

app.get("/api/ride-count/quarter", (req, res) => {
  var year = (req.query.year.split(" ")).pop()
  var qtr = req.query.quarter.split(" ").pop();
  var m1 = ``;
  var m2 = ``;

  if (qtr == "Q1") {
    m1 = 1;
    m2 = 3;
  } else if (qtr == "Q2") {
    m1 = 4;
    m2 = 6;
  } else if (qtr == "Q3") {
    m1 = 7;
    m2 = 9;
  } else if (qtr == "Q4") {
    m1 = 10;
    m2 = 12;
  }

  where_clause = `WHERE MONTH(date) BETWEEN ${m1} AND ${m2} AND YEAR(date) = ${year}`;

  var top_clause = ``;
  var order_by_clause = ``;
  if (req.query.filter == "Filter By: Top 10 Rider Count") {
    top_clause = `TOP 10`;
    order_by_clause = `ORDER BY w.visitor_count DESC`;
  } else if (req.query.filter == "Filter By: Bottom 10 Rider Count") {
    top_clause = `TOP 10`;
    order_by_clause = `ORDER BY w.visitor_count ASC`;
  } else if (req.query.filter == "Filter By: Top 10 Operation Count") {
    top_clause = `TOP 10`;
    order_by_clause = `ORDER BY ride_operations_count DESC`;
  } else if (req.query.filter == "Filter By: Bottom 10 Operation Count") {
    top_clause = `TOP 10`;
    order_by_clause = `ORDER BY ride_operations_count ASC`;
  }

  var ride_statistics_query = `
    SELECT ${top_clause}
      w.ride_ID,
      RIDE.ride_name,
      w.visitor_count,
      ride_operations_count
    FROM
      (
      SELECT
        R.ride_ID,
        P.visitor_count,
        R.operation_count as ride_operations_count
      FROM
        (
        SELECT
          Z.ride_ID,
          COUNT(Z.ride_ID) as operation_count
        FROM
          RIDE_OPERATION AS Z
        ${where_clause}
        GROUP BY
          Z.ride_ID
    ) as R
      LEFT OUTER JOIN (
        SELECT
          Q.ride_ID ,
          COUNT(V.vistor_id) as visitor_count
        FROM
          RIDE_OPERATION as Q
        LEFT OUTER JOIN Visitor_event as V
        ON
          V.events_id = Q.event_ID
        ${where_clause}
        GROUP BY
          Q.ride_ID
    ) as P
    ON
        P.ride_ID = R.ride_ID
    ) as w
    LEFT OUTER JOIN RIDE
    on
      RIDE.ride_ID = w.ride_ID
    ${order_by_clause};
  `

  executeStatement(ride_statistics_query, (ride_stat_rows) => {
    res.json(ride_stat_rows);
  })
})

app.get("/api/ride-count/month", (req,res) => {
  var year = (req.query.year.split(" ")).pop()
  var month = req.query.month.split(" ").pop();
  var mapping = {
    "January": 1,
    "February": 2,
    "March": 3,
    "April": 4,
    "May": 5,
    "June": 6,
    "July": 7,
    "August": 8,
    "September": 9,
    "October": 10,
    "November": 11,
    "December": 12
  };
  where_clause = `WHERE MONTH(date) = ${mapping[month]} AND YEAR(date) = ${year}`;

  var top_clause = ``;
  var order_by_clause = ``;
  if (req.query.filter == "Filter By: Top 10 Rider Count") {
    top_clause = `TOP 10`;
    order_by_clause = `ORDER BY w.visitor_count DESC`;
  } else if (req.query.filter == "Filter By: Bottom 10 Rider Count") {
    top_clause = `TOP 10`;
    order_by_clause = `ORDER BY w.visitor_count ASC`;
  } else if (req.query.filter == "Filter By: Top 10 Operation Count") {
    top_clause = `TOP 10`;
    order_by_clause = `ORDER BY ride_operations_count DESC`;
  } else if (req.query.filter == "Filter By: Bottom 10 Operation Count") {
    top_clause = `TOP 10`;
    order_by_clause = `ORDER BY ride_operations_count ASC`;
  }

  var ride_statistics_query = `
    SELECT ${top_clause}
      w.ride_ID,
      RIDE.ride_name,
      w.visitor_count,
      ride_operations_count
    FROM
      (
      SELECT
        R.ride_ID,
        P.visitor_count,
        R.operation_count as ride_operations_count
      FROM
        (
        SELECT
          Z.ride_ID,
          COUNT(Z.ride_ID) as operation_count
        FROM
          RIDE_OPERATION AS Z
        ${where_clause}
        GROUP BY
          Z.ride_ID
    ) as R
      LEFT OUTER JOIN (
        SELECT
          Q.ride_ID ,
          COUNT(V.vistor_id) as visitor_count
        FROM
          RIDE_OPERATION as Q
        LEFT OUTER JOIN Visitor_event as V
        ON
          V.events_id = Q.event_ID
        ${where_clause}
        GROUP BY
          Q.ride_ID
    ) as P
    ON
        P.ride_ID = R.ride_ID
    ) as w
    LEFT OUTER JOIN RIDE
    on
      RIDE.ride_ID = w.ride_ID
    ${order_by_clause};
  `

  executeStatement(ride_statistics_query, (ride_stat_rows) => {
    res.json(ride_stat_rows);
  })
})

app.get("/api/ride-count/week", (req,res) => {
  var year = (req.query.year.split(" ")).pop()
  var month = req.query.month.split(" ").pop();
  var wk = req.query.week.split(" ").pop();

  var daysInMonth = {
    "January": 31,
    "February": 28, // Note: Leap year handling is not included in this simple example
    "March": 31,
    "April": 30,
    "May": 31,
    "June": 30,
    "July": 31,
    "August": 31,
    "September": 30,
    "October": 31,
    "November": 30,
    "December": 31
  };
  var mapping = {
    "January": 1,
    "February": 2,
    "March": 3,
    "April": 4,
    "May": 5,
    "June": 6,
    "July": 7,
    "August": 8,
    "September": 9,
    "October": 10,
    "November": 11,
    "December": 12
  };
  var d1;
  var d2;
  var ddiff = Math.ceil(daysInMonth[month] / 4);
  if (wk == 1) {
    d1 = 1;
    d2 = d1 + 6;
  } else if (wk == 2) {
    d1 = 8;
    d2 = d1 + 6;
  } else if (wk == 3) {
    d1 = 15;
    d2 = d1 + 6;
  } else {
    d1 = 21;
    d2 = daysInMonth[month];
  }

  var date1 = year + "-" + mapping[month] + "-" + d1;
  var date2 = year + "-" + mapping[month] + "-" + d2;
  where_clause = `WHERE CAST([date] AS DATE) BETWEEN '${date1}' AND '${date2}'`;

  var top_clause = ``;
  var order_by_clause = ``;
  if (req.query.filter == "Filter By: Top 10 Rider Count") {
    top_clause = `TOP 10`;
    order_by_clause = `ORDER BY w.visitor_count DESC`;
  } else if (req.query.filter == "Filter By: Bottom 10 Rider Count") {
    top_clause = `TOP 10`;
    order_by_clause = `ORDER BY w.visitor_count ASC`;
  } else if (req.query.filter == "Filter By: Top 10 Operation Count") {
    top_clause = `TOP 10`;
    order_by_clause = `ORDER BY ride_operations_count DESC`;
  } else if (req.query.filter == "Filter By: Bottom 10 Operation Count") {
    top_clause = `TOP 10`;
    order_by_clause = `ORDER BY ride_operations_count ASC`;
  }

  var ride_statistics_query = `
    SELECT ${top_clause}
      w.ride_ID,
      RIDE.ride_name,
      w.visitor_count,
      ride_operations_count
    FROM
      (
      SELECT
        R.ride_ID,
        P.visitor_count,
        R.operation_count as ride_operations_count
      FROM
        (
        SELECT
          Z.ride_ID,
          COUNT(Z.ride_ID) as operation_count
        FROM
          RIDE_OPERATION AS Z
        ${where_clause}
        GROUP BY
          Z.ride_ID
    ) as R
      LEFT OUTER JOIN (
        SELECT
          Q.ride_ID ,
          COUNT(V.vistor_id) as visitor_count
        FROM
          RIDE_OPERATION as Q
        LEFT OUTER JOIN Visitor_event as V
        ON
          V.events_id = Q.event_ID
        ${where_clause}
        GROUP BY
          Q.ride_ID
    ) as P
    ON
        P.ride_ID = R.ride_ID
    ) as w
    LEFT OUTER JOIN RIDE
    on
      RIDE.ride_ID = w.ride_ID
    ${order_by_clause};
  `

  executeStatement(ride_statistics_query, (ride_stat_rows) => {
    res.json(ride_stat_rows);
  })
})

app.get("/api/employee-count-ride-operations", (req, res) => {
  console.log("GET /api/employee-count-ride-operations");
  var where_clause = ``;
  if (req.query.time == "Time Period: Year") {
    var year = (req.query.year.split(" ")).pop()
    where_clause = `WHERE YEAR(date) = ${year}`;
  } else if (req.query.time == "Time Period: Quarter") {
    var qtr = req.query.quarter.split(" ").pop();
    var year = (req.query.year.split(" ")).pop()
    var m1 = ``;
    var m2 = ``;

    if (qtr == "Q1") {
      m1 = 1;
      m2 = 3;
    } else if (qtr == "Q2") {
      m1 = 4;
      m2 = 6;
    } else if (qtr == "Q3") {
      m1 = 7;
      m2 = 9;
    } else if (qtr == "Q4") {
      m1 = 10;
      m2 = 12;
    }

    where_clause = `WHERE MONTH(date) BETWEEN ${m1} AND ${m2} AND YEAR(date) = ${year}`;
  } else if (req.query.time == "Time Period: Month") {
    var year = (req.query.year.split(" ")).pop()
    var month = req.query.month.split(" ").pop();
    var mapping = {
      "January": 1,
      "February": 2,
      "March": 3,
      "April": 4,
      "May": 5,
      "June": 6,
      "July": 7,
      "August": 8,
      "September": 9,
      "October": 10,
      "November": 11,
      "December": 12
    };
    where_clause = `WHERE MONTH(date) = ${mapping[month]} AND YEAR(date) = ${year}`;
  } else if (req.query.time == "Time Period: Week") {
    var year = (req.query.year.split(" ")).pop()
    var month = req.query.month.split(" ").pop();
    var wk = req.query.week.split(" ").pop();

    var daysInMonth = {
      "January": 31,
      "February": 28, // Note: Leap year handling is not included in this simple example
      "March": 31,
      "April": 30,
      "May": 31,
      "June": 30,
      "July": 31,
      "August": 31,
      "September": 30,
      "October": 31,
      "November": 30,
      "December": 31
    };
    var d1;
    var d2;
    var ddiff = Math.ceil(daysInMonth[month] / 4);
    if (wk == 1) {
      d1 = 1;
      d2 = d1 + ddiff;
    } else if (wk == 2) {
      d1 = 2 + ddiff;
      d2 = d1 + ddiff;
    } else if (wk == 3) {
      d1 = 3 + ddiff * 2;
      d2 = d1 + ddiff;
    } else {
      d1 = 4 + ddiff * 3;
      d2 = daysInMonth[month];
    }

    var date1 = year + "-" + month + "-" + d1;
    var date2 = year + "-" + month + "-" + d2;
    where_clause = `WHERE date BETWEEN ${date1} AND ${date2}`;
  }

  var employee_statistics_query = `
    SELECT COUNT(DISTINCT employee_ID) FROM RIDE_OPERATION
    ${where_clause};
  `
  
  executeStatement(employee_statistics_query, (employee_stat_rows) => {
    res.json(employee_stat_rows)
  })
})

app.get("/api/unique-parks", (req, res) => {
  var sql = `
    SELECT DISTINCT p_location FROM THEME_PARK
  ` 
  executeStatement(sql, (rows) => {
    return res.json(rows);
  }) 
})

app.get("/api/rainout-count", (req, res) => {
  console.log("GET api/rainout-count");

  var where_clause = '';
  var order_clause = '';
  if (req.query.time == "annual") {
    where_clause = `WHERE YEAR(date) = ${req.query.year}`;
  } else if (req.query.time == "quarter") {
    var qtr = req.query.quarter;
    var year = req.query.year;
    var m1 = ``;
    var m2 = ``;

    if (qtr == "1") {
      m1 = 1;
      m2 = 3;
    } else if (qtr == "2") {
      m1 = 4;
      m2 = 6;
    } else if (qtr == "3") {
      m1 = 7;
      m2 = 9;
    } else if (qtr == "4") {
      m1 = 10;
      m2 = 12;
    }
    where_clause = `WHERE MONTH(date) BETWEEN ${m1} AND ${m2} AND YEAR(date) = ${year}`;
  } else if (req.query.time == "month") {
    var month = req.query.month;
    var year = req.query.year;
    where_clause = `WHERE MONTH(date) = ${month} AND YEAR(date) = ${year}`;
  }

  if (req.query.filter != "none") {
    if (where_clause) {
      where_clause += ` AND p_location = '${req.query.filter}'`;
    } else {
      where_clause += `WHERE p_location = '${req.query.filter}'`;
    }
  }

  if (req.query.order === "month_asc") {
    order_clause += "ORDER BY p_location ASC";
  } else if (req.query.order === "month_dsc") {
    order_clause += "ORDER BY p_location DESC";
  } else if (req.query.order === "rainout_asc") {
    order_clause += "ORDER BY date ASC";
  } else if (req.query.order === "rainout_dsc") {
    order_clause += "ORDER BY date DESC"
  }

  var sql = `
  SELECT
    rainout_ID, date, p_location, notes
  FROM
    RAINOUT
  LEFT OUTER JOIN
    THEME_PARK
  ON
    THEME_PARK.park_id  = RAINOUT.park_ID
  ${where_clause}
  ${order_clause}
  ;
  `
  executeStatement(sql, (rows) => {
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

app.get("/api/newVisitors", (req, res) => {
  console.log("GET api/newVisitors");
  const sql_call = "SELECT first_name, last_name FROM VISITOR;";
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

app.use(bodyParser.json());

app.get("/api/tickets", (req, res) => {
  console.log("GET api/tickets");
  const sql_call = "SELECT transaction_ID, visitor_ID, ticket_type, FORMAT(date, 'yyyy-MM-dd') AS date, COALESCE(CONVERT(VARCHAR, time, 108), '00:00:00') AS time, ticket_id, employee_ID, amount FROM TICKET_SALE;";

  executeStatement(sql_call, (rows) => {
    console.log(rows);
    res.json(rows);
  });
});

app.get("/api/ticketCount", (req, res) => {
  console.log("GET api/ticketCount");
  const sql_call = "SELECT COUNT(*) FROM TICKET_SALE;";
  executeStatement(sql_call, (rows) => {
    console.log(rows);
    res.json(rows);
  });
});

app.use(bodyParser.json());

app.get("/api/entries", (req, res) => {
  console.log("GET api/entries");
  const sql_call = "SELECT visitor_ID, FORMAT(entry_date, 'yyyy-MM-dd') AS entry_date, COALESCE(CONVERT(VARCHAR, entry_time, 108), '00:00:00') AS entry_time, ticket_type, entry_ID, p_location FROM ENTRY_LOG;";

  executeStatement(sql_call, (rows) => {
    console.log(rows);
    res.json(rows);
  });
});

app.get("/api/entryCount", (req, res) => {
  console.log("GET api/entryCount");
  const sql_call = "SELECT COUNT(*) FROM ENTRY_LOG;";
  executeStatement(sql_call, (rows) => {
    console.log(rows);
    res.json(rows);
  });
});


app.post("/api/update-visitor/:visitorId", async (req, res) => {
  const visitorId = req.params.visitorId;
  const { first_name, last_name, contact_information, emergency_contact } = req.body;

  try {
      const connection = new Connection(config);

      await new Promise((resolve, reject) => {
          connection.on('connect', (err) => {
              if (err) {
                  console.error('Connection Error:', err);
                  reject(err);
              } else {
                  resolve();
              }
          });

          connection.connect();
      });

      const request = new Request(`
          UPDATE VISITOR 
          SET first_name = @first_name, 
              last_name = @last_name, 
              contact_information = @contact_information, 
              emergency_contact = @emergency_contact
          WHERE visitor_ID = @visitorId;
      `, (err) => {
          if (err) {
              console.error('SQL Query Error:', err);
              res.status(500).json({ success: false, error: 'Error updating visitor information' });
          } else {
              res.status(200).json({ success: true });
          }

          connection.close();
      });

      request.addParameter('visitorId', TYPES.BigInt, visitorId);
      request.addParameter('first_name', TYPES.NVarChar, first_name);
      request.addParameter('last_name', TYPES.NVarChar, last_name);
      request.addParameter('contact_information', TYPES.NVarChar, contact_information);
      request.addParameter('emergency_contact', TYPES.NVarChar, emergency_contact);

      connection.execSql(request);
  } catch (error) {
      res.status(500).json({ success: false, error: 'Error connecting to the database' });
  }
  
});

app.use(bodyParser.json());

// Endpoint to get the status
app.get('/api/status', (req, res) => {
    // Query the ConfigurationTable to get the status
    // Send the status as JSON
    // Replace with actual database query logic
    const status = getStatusFromDatabase(); 
    res.json({ status });
});
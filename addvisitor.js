

function executeStatement1(fname, lname, phone, ename, age, tickettype) {
    const { Connection, Request, TYPES } = require('tedious');
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
            encrypt: true,
            database: 'CougarThemeParkBackUp',
        },
    };
    const connection = new Connection(config);
    // Handle connection errors
    connection.on('error', function (err) {
        console.error('Connection error:', err);
    });
    // Wait for the connection to be established
    connection.on('connect', function (err) {
        if (err) {
            console.error('Connection error:', err);
        } else {
            console.log('Connected');
            // Now that the connection is established, you can execute your SQL request
            console.log('TEST');        
        }
    });

    // Establish the connection
    connection.connect();


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
    request.addParameter('fname', TYPES.Char, fname);
    request.addParameter('lname', TYPES.Char, lname);
    request.addParameter('phone', TYPES.BigInt, phone);
    request.addParameter('ename', TYPES.BigInt, ename);
    request.addParameter('age', TYPES.TinyInt, age);
    request.addParameter('tickettype', TYPES.TinyInt, tickettype);

    request.on('row', function (columns) {
        columns.forEach(function (column) {
            if (column.value === null) {
                console.log('NULL');
            } else {
                console.log('Visitor ID of inserted item is ' + column.value);
            }
        });
    });

    // Close the connection after the final event emitted by the request, after the callback passes
    request.on('requestCompleted', function (rowCount, more) {
        connection.close();
    });

    connection.execSql(request);
}
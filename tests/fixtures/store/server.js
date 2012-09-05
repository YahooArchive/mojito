/*
* Copyright (c) 2011 Yahoo! Inc. All rights reserved.
*/
var m = require('mojito');

// you can access log formatter, writer, or publisher for the server here

//m.setLogPublisher(function() {
//    console.log(arguments);
//});

module.exports = m.createServer();

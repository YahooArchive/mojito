/*jslint anon:true, sloppy:true*/


/**
 * Create and start a new Mojito server/application.
 */
var Mojito = require('mojito');
var app = Mojito.createServer();

module.exports = app.start();

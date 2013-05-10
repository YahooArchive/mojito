

/*jslint node:true*/

'use strict';

var express = require('express'),
    mojito = require('../../'),
    app;

app = express();

// register custom middleware here
// app.use(require('./middleware/foo.js'));

// Registers Mojito's default
app.use(mojito.middleware(app));
/*
// By doing this, give users more control over which order middleware
// are registered.
app.mojito.middleware().forEach(function (mid) {
    debug('app.use(): ' + mid);
    app.use(app.mojito[mid]);
});
*/

// In addition to mojito `routes.json`, user can hook up additional 
// mounting points if necessary.
app.get('/status', function (req, res) {
    res.send('200 OK');
});

app.listen(app.get('port'), function () {
    console.log('Server listening on port ' + app.get('port') + ' ' +
                   'in ' + app.get('env') + ' mode');
});

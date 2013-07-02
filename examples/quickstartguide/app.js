/*
* Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/


/*jslint node:true*/

'use strict';

var express = require('express'),
    mojito = require('../../'),
    app;

app = express();

app.use(mojito.middleware());
app.mojito.attachRoutes();
app.post('/tunnel', mojito.tunnelMiddleware());

// regex paths should be defined in `app.js`. 
app.get(/\/|index.html/, mojito.dispatch('shelf.index'));

app.get('/status', function (req, res) {
    res.send('200 OK');
});

app.listen(app.get('port'), function () {
    console.log('Server listening on port ' + app.get('port') + ' ' +
                   'in ' + app.get('env') + ' mode');
});

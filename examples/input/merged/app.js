/*
* Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/


/*jslint node:true*/

'use strict';

var debug = require('debug')('app'),
    express = require('express'),
    mojito = require('../../../'),
    app;

app = express();

app.use(mojito.middleware());
app.mojito.attachRoutes();
app.post('/tunnel', mojito.tunnelMiddleware());

// "root": {
//     "verbs": ["post"],
//     "path": "/mergedparams",
//     "call": "param-grabber.index",
//     "params": "likes=beer"
// },
app.post('/mergedparams', function (req, res, next) {
    req.params = req.params || {};
    req.params.likes = 'beer';
    next();
}, mojito.dispatch('param-grabber.index'));

app.get('/status', function (req, res) {
    res.send('200 OK');
});

app.listen(app.get('port'), function () {
    debug('Server listening on port ' + app.get('port') + ' ' +
               'in ' + app.get('env') + ' mode');
});

/*
* Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/


/*jslint node:true*/

'use strict';

var debug = require('debug')('app'),
    express = require('express'),
    mojito = require('../../../../..'),
    app;

app = express();

app.use(mojito.middleware());
app.mojito.attachRoutes();
app.post('/tunnel', mojito.tunnelMiddleware());

function rt(req, res, next) {
    return mojito.dispatch(req.params.type + '.' + req.params.action)(req, res, next);
}
app.get('/:type/:action', rt);
app.post('/:type/:action', rt);
app.put('/:type/:action', rt);
app.head('/:type/:action', rt);
app['delete']('/:type/:action', rt);

app.get('/status', function (req, res) {
    res.send('200 OK');
});

app.listen(app.get('port'), function () {
    debug('Server listening on port ' + app.get('port') + ' ' +
               'in ' + app.get('env') + ' mode');
});

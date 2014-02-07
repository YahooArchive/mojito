/*
* Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/


/*jslint node:true*/

'use strict';

var debug = require('debug')('app'),
    express = require('express'),
    libmojito = require('../../../../..'),
    app;

app = express();
app.set('port', process.env.PORT || 8666);
libmojito.extend(app);

app.use(libmojito.middleware());
app.mojito.attachRoutes();
app.post('/tunnel', libmojito.tunnelMiddleware());

function rt(req, res, next) {
    return libmojito.dispatch(req.params.type + '.' + req.params.action)(req, res, next);
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

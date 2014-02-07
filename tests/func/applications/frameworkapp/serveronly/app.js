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
    app,
    mid;

app = express();
app.set('port', process.env.PORT || 8666);
libmojito.extend(app);

app.use(libmojito.middleware());
app.mojito.attachRoutes();
app.post('/tunnel', libmojito.tunnelMiddleware());

// "default": {
//     "verbs": ["get", "post", "put", "head", "delete"],
//     "path": "/:mojit-base/:mojit-action",
//     "call": "{mojit-base}.{mojit-action}"
// }
mid = libmojito.dispatch('{mojitBase}.{mojitAction}');
app.get('/:mojitBase/:mojitAction', mid);
app.post('/:mojitBase/:mojitAction', mid);
app.put('/:mojitBase/:mojitAction', mid);
app.head('/:mojitBase/:mojitAction', mid);
app['delete']('/:mojitBase/:mojitAction', mid);

app.get('/status', function (req, res) {
    res.send('200 OK');
});

app.listen(app.get('port'), function () {
    debug('Server listening on port ' + app.get('port') + ' ' +
               'in ' + app.get('env') + ' mode');
});

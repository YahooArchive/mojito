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

// "testing-ac-url-find": {
//     "verb": ["get"],
//     "path": "/you/found/a/good/path",
//     "params": "secret=garden",
//     "call": "goodaction.goodindex"
// },
app.get('/you/found/a/good/path', function (req, res, next) {
    req.params = req.params || {};
    req.params.secret = 'garden';
    next();
}, mojito.dispatch('goodaction.goodindex'));

// "_any_mojit_particular_action": {
//     "verbs": ["get"],
//     "path": "/:mojit-id/run_index",
//     "call": "{mojit-id}.index"
// },
app.get('/:mojitId/run_index', function (req, res, next) {
    return mojito.dispatch(req.params.mojitId + '.index')(req, res, next);
});

// "_any_mojit_action": {
//     "verbs": ["get", "post", "put"],
//     "path": "/:mojit-id/:mojit-action",
//     "call": "{mojit-id}.{mojit-action}"
// }
function rt(req, res, next) {
    return mojito.dispatch(req.params.mojitId + '.' + req.params.mojitAction)(req, res, next);
}
app.get('/:mojitId/:mojitAction', rt);
app.post('/:mojitId/:mojitAction', rt);
app.put('/:mojitId/:mojitAction', rt);

app.get('/status', function (req, res) {
    res.send('200 OK');
});

app.listen(app.get('port'), function () {
    debug('Server listening on port ' + app.get('port') + ' ' +
               'in ' + app.get('env') + ' mode');
});

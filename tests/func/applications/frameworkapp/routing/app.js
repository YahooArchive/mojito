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


// "_any_mojit_particular_action": {
//     "verbs": ["get"],
//     "path": "/:mojit-id/run_index",
//     "call": "{mojit-id}.index"
// },
app.get('/:mojitId/run_index', function (req, res, next) {
    return libmojito.dispatch(req.params.mojitId + '.index')(req, res, next);
});

// "_any_mojit_action": {
//     "verbs": ["get", "post", "put"],
//     "path": "/:mojit-id/:mojit-action",
//     "call": "{mojit-id}.{mojit-action}"
// }
function rt(req, res, next) {
    return libmojito.dispatch(req.params.mojitId + '.' + req.params.mojitAction)(req, res, next);
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

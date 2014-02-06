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

// "routeparamssimple": {
//     "verbs": ["get"],
//     "path": "/RouteParamsSimple",
//     "call": "RouteParams.routeParamsSimple",
//     "params": "foo=fooval&bar=barval"
// },
app.get('/RouteParamsSimple', function (req, res, next) {
    req.params = req.params || {};
    req.params.foo = 'fooval';
    req.params.bar = 'barval';
    next();
}, libmojito.dispatch('RouteParams.routeParamsSimple'));

// "mergeparamssimple": {
//     "verbs": ["post"],
//     "path": "/MergeParamsSimple",
//     "call": "MergeParams.mergeParamsSimple",
//     "params": {
//         "likes": "Beer"
//     }
// }
app.post('/MergeParamsSimple', function (req, res, next) {
    req.params = req.params || {};
    req.params.likes = 'Beer';
    next();
}, libmojito.dispatch('MergeParams.mergeParamsSimple'));


// "mergeparams": {
//     "verbs": ["post"],
//     "path": "/MergeParams",
//     "call": "MergeParams.mergeParams",
//     "params": "likes=Beer"
//  },
app.post('/MergeParams', function (req, res, next) {
    req.params = req.params || {};
    req.params.likes = 'Beer';
    next();
}, libmojito.dispatch('MergeParams.mergeParams'));

// "routeparams": {
//     "verbs": ["get"],
//     "path": "/RouteParams",
//     "call": "RouteParams.routeParams",
//     "params": {
//        "foo": "fooval",
//        "bar": "barval"
//     }
// },
app.get('/RouteParams', function (req, res, next) {
    req.params = req.params || {};
    req.params.foo = 'fooval';
    req.params.bar = 'barval';
    next();
}, libmojito.dispatch('RouteParams.routeParams'));


// "default": {
//     "verbs": ["get", "post", "put", "head", "delete"],
//     "path": "/:mojit-id/:mojit-action",
//     "call": "{mojit-id}.{mojit-action}"
// }
function rt(req, res, next) {
    libmojito.dispatch(req.params.mojitType + '.' + req.params.mojitAction)(req, res, next);
}
app.get('/:mojitType/:mojitAction', rt);
app.post('/:mojitType/:mojitAction', rt);
app.put('/:mojitType/:mojitAction', rt);
app.head('/:mojitType/:mojitAction', rt);
app['delete']('/:mojitType/:mojitAction', rt);

app.get('/status', function (req, res) {
    res.send('200 OK');
});

app.listen(app.get('port'), function () {
    debug('Server listening on port ' + app.get('port') + ' ' +
               'in ' + app.get('env') + ' mode');
});

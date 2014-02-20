version @VERSION@
=================

Notes
-----

```
NOTE:
For now, keeping the HISTORY for #next in this file. Once #next is merged back
into #develop, its content can be moved to HISTORY.md in order to avoid
unnecessary conflict on every merge.

This is a document in progress as more work is being done on #next.
```

This release introduces a set of new APIs and concepts.

Please refer to some of the examples apps under the `examples/` folder to get
an overview of what have changed.

Deprecations, Removals
----------------------

* Mojito no longer supports `index.js` and `server.js` to start up the server.
  Applications will instead instantiate Mojito as follows:

      var libmojito = require('mojito'),
          express = require('express'),
          app;

      app = express();
      libmojito.extend(app, { /* context */ });
      // at this point, access mojito instance via `app.mojito`

* Middleware configuration is no longer supported via `application.json`.
  Applications can register their middleware using the Express API. To enable
  Mojito default list of middleware, use the following:

      app.use(libmojito.middleware());

  If you want to have more granular control, use the following:

      app.use(libmojito.middleware['mojito-handler-static']());
      app.use(libmojito.middleware['mojito-parser-body']());
      app.use(libmojito.middleware['mojito-parser-cookies']());
      app.use(myCustomContextualizerMiddleware());
      app.use(libmojito.middleware['mojito-contextualizer']());
      app.use(libmojito.middleware['mojito-handler-tunnel']());
      app.use(anotherCustomMiddleware());

* `routes.json` configuration is no longer loaded by default. To tell Mojito to
  do so, use the following:

      app.mojito.attachRoutes();

  Applications can also pass in an array of route configuration names if
  needed.

* `routes.json` configuration only support `call` and `path` properties.

* `ac.url.make()` and `Y.mojito.RouteMaker.make()` no longer throws exception.
  Instead, the api returns `null` in order to provide the application more
  control on how best to handle this error.

* The `ac.url.find()` and `Y.mojito.RouteMaker.find()` methods are now
  deprecated and will be removed in a future version.

  Applications that rely on this API should familiaze with the `express-map`
  package by querying the route object by `name` or `path`.

* Expanded metadata is now removed. This means we will not longer support
  synthetic modules that were expanded by default, e.g.: `loader-yui3-base`, `loader-yui3-expanded` and `loader-app-resolved`. If you are using any of those 3 entries in the YUI configuration, you should use `loader-app` and loader-app-base` as your seed modules. In fact we recommend to not customize `yui.config.seed` in your `application.json`.

Features
--------

* To register Mojito routes programmatically instead of using `routes.json`:

```
// app.js
app.get('/foo', mojito.dispatch('foo.index'));
app.map('/foo', 'foo');
app.map('/foo', 'get#foo.index');
```

  In addition to setting up the path `/foo` to be routed to the Mojito
  dispatcher, setup 2 additional "aliases". The second alias is the HTTP method
  concatenated with the `call` value using the `#` delimeter.

  This is equivalent to doing this in `routes.json` in "pre-next":

```
[{
    "settings": [ "master" ],
    "foo": {
        verbs: [ "get" ],
        path: "/foo",
        call: "foo.index",
        params: { /* optional prams */ }
    }
}]
```

  For more detail information, please check any of the applications under
  `examples/` folder.

New Dependencies
----------------

* Mojito now leverages the following packages for its routing implementation: 
  `express-map` and `express-annotations`

Bug Fixes
---------

* `ac.config.getRoutes()` now returns the route configuration object using the
  format from `express-map#getRouteMap()`.

Acknowledgements
----------------


/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-route-maker-tests', function(Y, NAME) {
    
    var suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert,
        OA = YUITest.ObjectAssert;
    
    suite.add(new YUITest.TestCase({
    
        name: 'make() tests',
        
        setUp: function() {
            routeMaker = new Y.mojito.RouteMaker(routes);
        },

        'route maker for dynamic id and action GET': function() {

            var url = routeMaker.make('foo.bar');

            A.areSame('/foo/bar', url, "Bad URL");

        },

        'route maker for dynamic id and action POST': function() {

            var url = routeMaker.make('foo.bar', 'POST');

            A.areSame('/foo/bar', url, "Bad URL");

        },

        'route maker for dynamic id only': function() {

            var url = routeMaker.make('foo.index');

            A.areSame('/foo/roger', url, "Bad URL");

        },

        'TODO: route maker verb match': function() {
            A.skip();
        },

        'route maker for dynamic action only': function() {

            var url = routeMaker.make('bingo.chop');

            A.areSame('/baz/chop', url, "Bad URL");

        },

        'route maker for dynamic id and action and extra variable': function() {

            var url = routeMaker.make('foo.bar?variable=yada');

            A.areSame('/foo/bar/yada', url, "Bad URL");

        },

        'router make URL weather zip': function() {

            var url = routeMaker.make('mojit_weather.index?zip=94032');

            A.areSame('/weather/94032/', url);
        },

        'router make URL weather no zip': function() {

            var url = routeMaker.make('mojit_weather.index');

            A.areSame('/weather/', url);
        },

        'router make URL weather zip and rad': function() {

            var url = routeMaker.make('mojit_weather.index?zip=23456&rad=23');

            A.areSame('/weather/at/23456/within/23/', url);
        },

        'router make URL weather zip and rad and page': function() {

            var url = routeMaker.make('mojit_weather.index?zip=23456&page=2&rad=23');

            A.areSame('/weather/at/23456/within/23/section/2', url);
        },

        'wildcard works': function() {

            var url = routeMaker.make('fee.fi');

            A.areSame('/fee/fi', url);
        },

        'static works': function() {

            var url = routeMaker.make('YMVC_default.index');

            A.areSame('/index.html', url);
        },

        'mojit / action to root': function() {

            var url = routeMaker.make('super.cuban');

            A.areSame('/', url);
        }
        
    }));

    suite.add(new YUITest.TestCase({

        name: 'find() tests',

        setUp: function() {
            //  Use the same routes here as we do for the 'make' tests
            this.routeMaker = new Y.mojito.RouteMaker(routes);
        },

        'router find URL weather action GET': function() {

            var url = routeMaker.find('/weather/', 'GET');

            A.isNotUndefined(url);
        },

        'router find URL weather zip action GET': function() {

            var url = routeMaker.find('/weather/94032/', 'GET');

            A.isNotUndefined(url);
        },

        'route find URL weather zip and radius action GET': function() {

            var url = routeMaker.find('/weather/at/94032/within/25/');

            A.isNotUndefined(url);
        },

        'route find URL index.html': function() {

            var url = routeMaker.find('index.html');

            A.isNotUndefined(url);
        },

    }));

    YUITest.TestRunner.add(suite);

    var routes = {
        "weather_url_zip_rad_page": {
            "verbs": ["get"],
            "path": "/weather/at/:zip/within/:rad/section/:page",
            "call": "mojit_weather.index"
        },
        "weather_url_zip_rad": {
            "verbs": ["get"],
            "path": "/weather/at/:zip/within/:rad/",
            "call": "mojit_weather.index"
        },
        "weather_url_zip": {
            "verbs": ["get"],
            "path": "/weather/:zip/",
            "regex": {"zip":"[0-9]+"},
            "call": "mojit_weather.index"
        },
        "weather_url": {
            "verbs": ["get"],
            "path": "/weather/",
            "call": "mojit_weather.index"
        },
        "_index_html":{
            "path": "/index.html",
            "call": "YMVC_default.index"
        },
        "_index":{
            "path": "/",
            "params": "fee=yoyo",
            "call": "super.cuban"
        },
        "_dynamic_id_only":{
            "verbs": ["get","post"],
            "path": "/:id/roger",
            "call": "{id}.index"
        },
        "_dynamic_action_only":{
            "verbs": ["get","post"],
            "path": "/baz/:action",
            "call": "bingo.{action}"
        },
        "weather_url_dynamic_action": {
            "verbs": ["get"],
            "path": "/weathergo/:action",
            "call": "mojit_weather.{action}"
        },
        "_default_module_action with value":{
            "verbs": ["get","post"],
            "path": "/:mojit-base/:mojit-action/:variable",
            "call": "{mojit-base}.{mojit-action}"
        },
        "_default_module_action get":{
            "verbs": ["get"],
            "path": "/:id/:m-action",
            "call": "{id}.{m-action}"
        },
        "_default_module_action post":{
            "verbs": ["post"],
            "path": "/:id/:m-action",
            "call": "{id}.{m-action}"
        },
        "_default_module":{
            "verbs": ["get","post","put"],
            "path": "/:mojit-base/*",
            "call": "{mojit-base}.index"
        }
    };

    suite.add(new YUITest.TestCase({

        name: 'getComputedRoutes() tests',

        setUp: function() {
            this.routeMaker = new Y.mojito.RouteMaker(getComputedRoutes_routes);
        },

        'computedRoutes() are available after construction': function() {
            var computedRoutes = this.routeMaker.getComputedRoutes(),
                route = computedRoutes["index"];

            OA.ownsKeys(["ext_match", "int_match"], route, "Computed routes not immediately available");
        },

        'computedRoutes() changes verbs from array to object': function() {
            // the client-side optimization behavior depends on route calculation
            // being skipped when verbs are changed from an array to an object

            var computedRoutes = this.routeMaker.getComputedRoutes(),
                route = computedRoutes["index_for_post"];

            A.isTrue(Y.Lang.isObject(route.verbs), "Route verbs should have been converted from array to object");
        }

    }));

    var getComputedRoutes_routes = {
        "index":{
            "path": "/index.html",
            "call": "default.index"
        },

        "index_for_post":{
            "verbs": ["post"],
            "path": "/index.html",
            "call": "default.index"
        }
    };

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: [
    'mojito-route-maker'
]});

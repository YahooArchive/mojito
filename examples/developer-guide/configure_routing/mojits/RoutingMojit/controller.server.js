/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true*/

YUI.add('RoutingMojit', function(Y, NAME) {
    // Builds object containing route information
    function route_info(ac) {
        var methods = "",
            name = "",
            action = ac.action,
            path = ac.http.getRequest().url,
            routes = ac.config.getRoutes();
        if (action === "index" && path === "/") {
            name = routes.root_route.name;
            Object.keys(routes.root_route.verbs).forEach(function(n) {
                methods += n + ", ";
            });
        } else if (action==="index") {
            name = routes.index_route.name;
            Object.keys(routes.index_route.verbs).forEach(function(n) {
                methods += n + ", ";
            });
        } else {
            name = routes.show_route.name;
            Object.keys(routes.show_route.verbs).forEach(function(n) {
                methods += n + ", ";
            });
        }
        return {
            "path": path,
            "name": name,
            "methods": methods.replace(/, $/, "")
        };
    }
    Y.namespace('mojito.controllers')[NAME] = {
        init: function (config) {
            this.config = config;
        },
        index: function (ac) {
            ac.done(route_info(ac));
        },
        show: function (ac) {
            ac.done(route_info(ac));
        }
    };
}, '0.0.1', {requires: ['mojito-config-addon', 'mojito-http-addon']});

/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
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

		// Mojito no longer support more than one VERB per route entry
		// The route.name is now the route.path + '.' + route.call
        if (action === "index" && path === "/") {
            name = "root_route";
			if (routes['/.mapped_mojit.index'].verbs['GET']) {
                methods = 'GET';
            }
        } else if (action==="index") {
            name = "index_route";
			if (routes['/index.mapped_mojit.index'].verbs['GET']) {
                methods = 'GET';
            }
        } else {
            name = "show_route";
			if (routes['/show.mapped_mojit.show'].verbs['POST']) {
                methods = 'POST';
            }
        }
        methods = methods.toUpperCase();
        return {
            "path": path,
            "name": name,
            "methods": methods.replace(/, $/, "")
        };
    }
    Y.namespace('mojito.controllers')[NAME] = {
        index: function (ac) {
            ac.done(route_info(ac));
        },
        show: function (ac) {
            ac.done(route_info(ac));
        }
    };
}, '0.0.1', {requires: ['mojito-config-addon', 'mojito-http-addon']});

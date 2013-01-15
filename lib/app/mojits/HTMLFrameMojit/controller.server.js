/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/


YUI.add('HTMLFrameMojit', function (Y, NAME) {

    'use strict';

    Y.namespace('mojito.controllers')[NAME] = {

        index: function (ac) {
            this.__call(ac);
        },


        __call: function (ac) {

            this._renderChild(ac, function (data, meta) {

                if (ac.config.get('deploy') === true) {
                    ac.deploy.constructMojitoClientRuntime(ac.assets,
                        meta.binders);
                }
                ac.frame.setup(data, meta);
                ac.frame.attach(data, meta);

                // Set specific template data
                data.title = ac.config.get('title') || 'Powered by Mojito';

                // Set specific meta data
                meta.view = {
                    name: 'index' // in case you want to use a custom view
                };

                ac.done(data, meta);
            });

        },

        /**
         * Renders a child mojit based on a config called "child" and
         * the "assets" collection specified in the specs.
         * @method _renderChild
         * @protected
         * @param {Object} ac Action Context Object.
         * @param {Function} callback The callback.
         */
        _renderChild: function (ac, callback) {
            // Grab the "child" from the config an add it as the
            // only item in the "children" map.
            var child = ac.config.get('child'),
                cfg;

            // Map the action to the child if the action
            // is not specified as part of the child config.
            child.action = child.action || ac.action;

            // Create a config object for the composite addon
            cfg = {
                children: {
                    child: child
                },
                assets: ac.config.get('assets')
            };

            // Now execute the child as a composite
            ac.composite.execute(cfg, callback);
        }

    };

}, '0.1.0', {requires: [
    'mojito-frame-addon',
    'mojito-deploy-addon',
    'mojito-config-addon',
    'mojito-composite-addon'
]});

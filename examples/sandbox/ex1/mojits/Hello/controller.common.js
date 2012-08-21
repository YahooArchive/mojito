/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('Hello', function(Y, NAME) {


    Y.namespace('mojito.controllers')[NAME] = {

        init: function(config) {
            Y.log('init', 'debug', NAME);
            this.config = config;
        },

        /*
         * Tests that mojit config is accessible.
         * Tests that url params are accessible.
         */
        index: function(ac) {
            var paramMessage = ac.params.url('message');
            var msg = 'Mojito index view is working.';
            if (this.config.test) {
                msg = msg + ' ' + this.config.test;
            }
            if (paramMessage) {
                msg = msg + ' ' + 'From the URL params: "' + paramMessage + '"';
            }
            ac.done({
                message: msg
            });
        },

        /*
         * Tests multiple models are accessible.
         */
        test: function(ac) {
            var fModel = ac.models.foo;
            var bModel = ac.models.bar;
            fModel.getMessage(function(fooMessage) {
                bModel.getMessage(function(barMessage) {
                    ac.done({
                        message: fooMessage + ' ' + barMessage
                    });
                });
            });
        },

        /*
         * Tests composite mojit shortcut works.
         */
        composite: function(ac) {
            var opts = {
                domain: 'mojito-cookie-test.edu',
                path: '/',
                expires: new Date(2035, 1, 1)
            };
            ac.composite.done();
        },

        /*
         * Tests more advanced manual composite mojit features, like ActionContext plugin
         * overrides (ACP Overrides).
         *
         * Sorry Matt - I bust this example and I'm not sure how to fix without talking to you
         *
         */
        manualComposite: function(ac) {

            var children = ac.config.get('children');

            ac.composite._dispatchChildren(children)

//            var template = {};
//            var self = ac;
//
//            var cfg = ac.mojit.config;
//            var children = {};
//            var buffers = {};
//
//            children = cfg.children;
//
//            var childCount = Y.Object.size(children);
//            var childDoneCount = 0;
//
//            Y.Object.each(children, function(child, id) { Y.log(ac);
//                var currentAdapter = ac.adapter;
//                var dispatchAdapter = {
//                    flush: function(childData) {
//                        buffers[child.id] = buffers[child.id] + childData;
//                    },
//                    done: function(childData, childViewMeta) {
//                        childDoneCount++;
//                        template[child.id] = buffers[child.id] + childData;
//                        if (childDoneCount === childCount) {
//                            self.done(template);
//                        }
//                    },
//
//                    /*
//                     * Here you see ACP Overrides in action. This allows me to override any Action
//                     * Context plugin by specifying namspaces and functions to override below. These
//                     * will be replacing the originally plugged ACPs by Mojito Core upon dispatch.
//                     *
//                     * This gives the parent mojit total control over all aspects of how the child
//                     * mojits execute.
//                     */
//                    acpOverrides: {
//                        params: {
//                            getFromMerged: function(key) {
//                                var p = ac.params.merged(key);
//                                var prefix = "PWND__";
//                                var newP = {};
//                                var pname;
//                                if (! this instanceof Y.mojito.ActionContext) {
//                                    throw Error("ACP Override was not executed within the scope "
//                                            + "of the Action Context object!");
//                                }
//                                if (Y.Lang.isString(p)) {
//                                    return prefix + p;
//                                }
//                                for (pname in p) {
//                                    newP[pname] = prefix + p[pname];
//                                }
//                                return newP;
//                            }
//                        }
//                    }
//                };
//
//                // mix all properties from currentAdapter into new adapter so they can be reused
//                // the same way. This will allow all plugins to work properly on the original
//                // foreign command adapter. this will -- for example -- copy over the http req/res
//                // objects if run on the server, or the params and callback objects from the binder
//                // if run on the client.
//                Object.keys(currentAdapter).forEach(function(prop) {
//                    dispatchAdapter[prop] = currentAdapter[prop];
//                });
//
//                child.id = id;
//                buffers[id] = '';
//
//                ac.composite.dispatch(child, null, dispatchAdapter);
//
//            });
        }

    };

}, '0.1.0', {requires: ['mojito']});

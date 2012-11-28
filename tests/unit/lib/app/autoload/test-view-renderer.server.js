/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true, node:true*/
/*global YUI*/

YUI.add('mojito-view-renderer-server-tests', function(Y, NAME) {
    var suite = new Y.Test.Suite(NAME),
        A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert;

    suite.add(new Y.Test.Case({

        name: 'mojito-view-renderer',

        setUp: function() {
            var ve = Y.namespace('mojito.addons.viewEngines');

            ve.foo = function(viewId, options) {
                A.areSame('someviewid', viewId);
                A.areSame(99, options.z);
            };

            ve.foo.prototype.render = function(data, mojitType, tmpl, adapter, meta, more) {
                A.areSame(6, arguments.length);
                A.areSame(1, arguments[0]);
                A.areSame(2, arguments[1]);
                A.areSame(3, arguments[2]);
                A.areSame(4, arguments[3]);
                A.areSame(5, arguments[4]);
                A.areSame(6, arguments[5]);
            };
        },

        tearDown: function() {},

        'test instantiating a mock renderer': function () {

            A.isObject(Y.mojito.addons);
            A.isFunction(Y.mojito.ViewRenderer);
            var vr = new Y.mojito.ViewRenderer('foo', 'someviewid', {z:99});
        },

        'test mock render method': function () {
            var vr = new Y.mojito.ViewRenderer('foo', 'someviewid', {z:99});
            vr.render(1,2,3,4,5,6);
        }

    }));

    Y.Test.Runner.add(suite);

}, '0.0.1', {requires: ['mojito-view-renderer']});

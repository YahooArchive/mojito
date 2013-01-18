/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use(
    'base',
    'oop',
    'mojito-resource-store',
    'addon-rs-yui',
    'addon-rs-dispatch-helper',
    'json',
    'test',
    function(Y) {

    var suite = new YUITest.TestSuite('mojito-addon-rs-dispatch-helper-tests'),
        libpath = require('path'),
        mojitoRoot = libpath.join(__dirname, '../../../../../../lib'),
        A = Y.Assert;


    function MockRS(config) {
        MockRS.superclass.constructor.apply(this, arguments);
    }
    MockRS.NAME = 'MockResourceStore';
    MockRS.ATTRS = {};
    Y.extend(MockRS, Y.Base, {
        initializer: function(cfg) {
            this._config = cfg || {};
        }
    });


    suite.add(new YUITest.TestCase({

        name: 'dispatch-helper rs addon tests',


        'augment getMojitTypeDetails with AC addons': function() {
            var fixtures = libpath.join(__dirname, '../../../../../fixtures/gsg5');
            var store = new Y.mojito.ResourceStore({ root: fixtures, mojitoRoot: mojitoRoot });
            store.preload();

            var details = store.getMojitTypeDetails('server', {}, 'PagedFlickr');
            // order matters
            A.areSame(4, details.acAddons.length, 'number of AC addons');
            A.areSame(JSON.stringify(['config','intl','params','url']), JSON.stringify(details.acAddons), 'correct order');
        },


        'resource cache support': function() {
            var fixtures = libpath.join(__dirname, '../../../../../fixtures/store');
            var store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs['dispatch-helper'], { appRoot: fixtures, mojitoRoot: mojitoRoot } );
            var plugin = store['dispatch-helper'];

            var cache = {};
            plugin.resourceCacheSave(cache);
            A.areSame(1, Y.Object.keys(cache).length);
            A.isObject(cache.acAddons);

            cache = {acAddons: { x: 'y' }};
            plugin.resourceCacheLoad(cache);
            A.isObject(plugin.acAddons);
            A.areSame(1, Y.Object.keys(plugin.acAddons).length);
            A.areSame('y', plugin.acAddons.x);
        }


    }));

    Y.Test.Runner.add(suite);

});

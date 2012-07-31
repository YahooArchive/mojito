/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-addon-rs-selector-tests', function(Y, NAME) {
    
    var suite = new YUITest.TestSuite(NAME),
        libpath = require('path'),
        mojitoRoot = libpath.join(__dirname, '../../../../../'),
        A = YUITest.Assert;


    function MockRS(config) {
        MockRS.superclass.constructor.apply(this, arguments);
    }
    MockRS.NAME = 'MockResourceStore';
    MockRS.ATTRS = {};
    Y.extend(MockRS, Y.Base, {
        initializer: function(cfg) {
            this._config = cfg || {};
            this.selectors = {
                'devdroid': true,
                'droid': true,
                'shelves': true,
                'right': true,
                '*': true
            };
        },
        validateContext: function() {},
        cloneObj: function(o) {
            return Y.clone(o);
        }
    });


    function cmp(x, y, msg, path) {
        if (Y.Lang.isArray(x)) {
            A.isArray(x, msg || 'first arg should be an array');
            A.isArray(y, msg || 'second arg should be an array');
            A.areSame(x.length, y.length, msg || 'arrays are different lengths');
            for (var i = 0; i < x.length; i += 1) {
                cmp(x[i], y[i], msg);
            }
            return;
        }
        if (Y.Lang.isObject(x)) {
            A.isObject(x, msg || 'first arg should be an object');
            A.isObject(y, msg || 'second arg should be an object');
            A.areSame(Object.keys(x).length, Object.keys(y).length, msg || 'object keys are different lengths');
            for (var i in x) {
                if (x.hasOwnProperty(i)) {
                    cmp(x[i], y[i], msg);
                }
            }
            return;
        }
        A.areSame(x, y, msg || 'args should be the same');
    }


    suite.add(new YUITest.TestCase({
        
        name: 'selector rs addon tests',
        
        'read dimensions': function() {
            // from mojito
            var fixtures = libpath.join(__dirname, '../../../../fixtures/store');
            var store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.config, { appRoot: fixtures, mojitoRoot: mojitoRoot } );
            store.plug(Y.mojito.addons.rs.selector, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            var have = store.selector.getPOSLFromContext({});
            var want = ['*'];
            cmp(have, want);

            var have = store.selector.getPOSLFromContext({runtime:'client'});
            var want = ['right', '*'];
            cmp(have, want);

            var have = store.selector.getPOSLFromContext({runtime:'server'});
            var want = ['shelves', '*'];
            cmp(have, want);

            var have = store.selector.getPOSLFromContext({device:'android'});
            var want = ['droid', '*'];
            cmp(have, want);

            var have = store.selector.getPOSLFromContext({runtime:'server', device:'android'});
            var want = ['shelves', 'droid', '*'];
            cmp(have, want);

            var have = store.selector.getPOSLFromContext({device:'android', environment:'dev'});
            var want = ['devdroid', 'droid', '*'];
            cmp(have, want);

            var have = store.selector.getPOSLFromContext({runtime:'server', device:'android', environment:'dev'});
            var want = ['shelves', 'devdroid', 'droid', '*'];
            cmp(have, want);
        },


        'get all posls': function() {
            var fixtures = libpath.join(__dirname, '../../../../fixtures/store');
            var store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.config, { appRoot: fixtures, mojitoRoot: mojitoRoot } );
            store.plug(Y.mojito.addons.rs.selector, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            var have = store.selector.getAllPOSLs();
            var want = [
                [ 'shelves', '*' ],
                [ 'shelves', 'devdroid', 'droid', '*' ],
                [ 'shelves', 'droid', '*' ],
                [ 'right', '*' ],
                [ 'right', 'devdroid', 'droid', '*' ],
                [ 'right', 'droid', '*' ]
            ];
            cmp(want, have);
        },


        'list used dimensions': function() {
            var fixtures = libpath.join(__dirname, '../../../../fixtures/store');
            var store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.config, { appRoot: fixtures, mojitoRoot: mojitoRoot } );
            store.plug(Y.mojito.addons.rs.selector, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            var have = store.selector._listUsedDimensions();
            var want = {
                runtime: ['server', 'client'],
                device: ['iphone', 'android'],
                environment: ['dev']
            }
            cmp(want, have);
        },


        'list used contexts': function() {
            var fixtures = libpath.join(__dirname, '../../../../fixtures/store');
            var store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.config, { appRoot: fixtures, mojitoRoot: mojitoRoot } );
            store.plug(Y.mojito.addons.rs.selector, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            var have = store.selector._listUsedContexts();
            var want = [
                { runtime: 'server', device: 'iphone', environment: 'dev' },
                { runtime: 'server', device: 'iphone' },
                { runtime: 'server', device: 'android', environment: 'dev' },
                { runtime: 'server', device: 'android' },
                { runtime: 'server', environment: 'dev' },
                { runtime: 'server' },
                { runtime: 'client', device: 'iphone', environment: 'dev' },
                { runtime: 'client', device: 'iphone' },
                { runtime: 'client', device: 'android', environment: 'dev' },
                { runtime: 'client', device: 'android' },
                { runtime: 'client', environment: 'dev' },
                { runtime: 'client' }
            ];
            cmp(want, have);
        }


    }));
    
    YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: [
    'base',
    'oop',
    'addon-rs-config',
    'addon-rs-selector'
]});

/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('mojito-test-extra', 'test', function(Y) {

    var A = Y.Assert,
        V = Y.Mock.Value,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,
        cases,

        mockery = require('mockery'),
        srcpath = Y.MOJITO_DIR + 'lib/app/commands/build/hybridapp.js',
        App,
        app,
        mocks = {},
        conf,
        count,
        counter = function() {count++;},
        fake_package_json = '{"dependencies":{}}';

    
    mocks = {
    	shared: {
    		init: counter,
    		mapStoreUris: counter,
    		mapDefxUris: counter,
    		mapFunkySpecUris: counter,
    		makeManifest: counter,
    		copyModule: counter,
    		mungePage: counter,
    	},
    	writer: {
    		read: function() {counter(); return fake_package_json},
    		write: counter,
    		writeJson: counter,
    	}
    }

    mockery.registerAllowable(srcpath);
    mockery.registerMock('./shared', mocks.shared);
    mockery.enable({'warnOnUnregistered': false});
    App = require(srcpath);

    conf = {
        mojitodir: '/Users/isao/Repos/mojito/myfork/',
        app: {
            name: 'staticpf',
            version: '0.0.1',
            specs: {
                frame: {},
                tunnelProxy: {}
            },
            dir: '/path/to/app'
        },
        snapshot: {
            name: '',
            tag: '',
            packages: {}
        },
        build: {
            attachManifest: false,
            forceRelativePaths: false,
            insertCharset: 'UTF-8',
            port: 1111,
            dir: '/path/to/build/dir',
            type: 'html5app',
            uris: []
        },
        context: {
            device: 'iphone'
        },
        contextqs: '?device=iphone',
        tunnelpf: '/tunnel',
        staticpf: 'staticpf'
    };

    cases = {
        name: 'build/html5app cases',

        setUp: function() {
            count = 0;
        },

        tearDown: function() {
            mockery.disable();
        },

        'test instance': function () {
            app = new App(null, null);
            A.isObject(app);
            A.isFunction(app.exec);
            A.isNull(app.scraper);

            app = new App(null, 'bam');
            A.areSame('bam', app.scraper);
        },

        'test shared.init() is called by constructor': function () {
            A.areSame(0, count);
            app = new App(null, null);
            A.areSame(1, count);
        },

        'test exec w/mock store': function () {
            var store = Y.Mock,
                scraper = {
                    on: function() {
                        return scraper;
                    },
                    start: function() {
                        return scraper;
                    },
                    fetch: function() {
                        return scraper;
                    },
                };

            Y.Mock.expect(store, {method: 'getAllURLs', args:[]});

            app = new App(mocks.writer, scraper);
            app.exec(conf, store, function() {});
            Y.Mock.verify(store);
        },

        'test exec and mojito dep case': function () {
            var store = Y.Mock,
                scraper = {
                    on: function() {
                        return scraper;
                    },
                    start: function() {
                        return scraper;
                    },
                    fetch: function() {
                        return scraper;
                    },
                };
            
            Y.Mock.expect(store, {method: 'getAllURLs', args:[]});
            fake_package_json = '{"dependencies":{"mojito":"*"}}';

            app = new App(mocks.writer, scraper);
            app.exec(conf, store, function() {});
            Y.Mock.verify(store);
        },

        'test exec calls shared.js X times': function () {
            var store = Y.Mock,
                scraper = {
                    on: function() {
                        return scraper;
                    },
                    start: function() {
                        return scraper;
                    },
                    fetch: function() {
                        return scraper;
                    },
                };

            Y.Mock.expect(store, {method: 'getAllURLs', args:[]});

            A.areSame(0, count);
            app = new App(mocks.writer, scraper);
            A.areSame(1, count);

            app.exec(conf, store, function() {});
            Y.Mock.verify(store);
            A.areSame(7, count);
        },

        'test exec calls scraper.js X times': function () {
            var store = Y.Mock,
                scraper = {
                    on: function() {
                        count++;
                        return scraper;
                    },
                    start: function() {
                        count++;
                        return scraper;
                    },
                    fetch: function() {
                        count++;
                        return scraper;
                    },
                };

            Y.Mock.expect(store, {method: 'getAllURLs', args:[]});

            A.areSame(0, count);
            app = new App(mocks.writer, scraper);
            A.areSame(1, count);

            app.exec(conf, store, function() {});
            Y.Mock.verify(store);
            A.areSame(11, count);
        },

    };

    Y.Test.Runner.add(new Y.Test.Case(cases));
});

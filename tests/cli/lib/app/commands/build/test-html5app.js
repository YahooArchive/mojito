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
        srcpath = Y.MOJITO_DIR + 'lib/app/commands/build/html5app.js',
        App,
        app,
        mocks = {},
        conf,
        count;


    mocks.init = function() {count++;};
    mocks.mapStoreUris = mocks.init;
    mocks.mapDefxUris = mocks.init;
    mocks.mapFunkySpecUris = mocks.init;
    mocks.makeManifest = mocks.init;
    mocks.copyModule = mocks.init;
    mocks.mungePage = mocks.init;

    mockery.registerAllowable(srcpath);
    mockery.registerMock('./shared', mocks);
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

        'test shared.init() is called by constructore': function () {
            A.areSame(0, count);
            app = new App(null, null);
            A.areSame(1, count);
        },

        'test mock store': function () {
            var store = Y.Mock(),
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

            app = new App(null, scraper);
            app.exec(conf, store, function() {});
            Y.Mock.verify(store);
        },

        'test exec calls shared.js X times': function () {
            var store = Y.Mock(),
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
            app = new App(null, scraper);
            A.areSame(1, count);

            app.exec(conf, store, function() {});
            Y.Mock.verify(store);
            A.areSame(6, count);
        },

        'test exec calls scraper.js X times': function () {
            var store = Y.Mock(),
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
            app = new App(null, scraper);
            A.areSame(1, count);

            app.exec(conf, store, function() {});
            Y.Mock.verify(store);
            A.areSame(10, count);
        },
    };

    Y.Test.Runner.add(new Y.Test.Case(cases));
});

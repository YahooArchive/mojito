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

        Scraper = require(Y.MOJITO_DIR + 'lib/app/commands/build/scraper.js');

    cases = {
        name: 'build/scraper cases',
        setUp: function() {},
        tearDown: function() {},

        'test instance': function () {
            var scraper = new Scraper({});
            A.isFunction(scraper.start);
            A.isFunction(scraper.fetch);
            A.isFunction(scraper.on);
            A.isFunction(scraper.emit);

            A.isObject(scraper);
            A.isObject(scraper.mojito);
            A.isNull(scraper.server);
        },

        'test start calls mojito and returns itself': function () {
            var mojito = Y.Mock(),
                scraper,
                self;

            Y.Mock.expect(mojito, {
                method: 'createServer',
                args: [V.Object],
            });

            scraper = new Scraper(mojito);
            self = scraper.start({port: 12345, context: ''});

            Y.Mock.verify(mojito);
            OA.areEqual(self, scraper);
        },

        'test fetch, listen() mock': function () {
            var server = Y.Mock(),
                mojito = {
                    createServer: function() {
                        return server;
                    }
                };

            Y.Mock.expect(server, {
                method: 'listen',
                args: [null, null, V.Function],
            });

            scraper = new Scraper(mojito);
            scraper.start({port: 12345, context: ''});
            scraper.fetch({}, function(err) {});

            Y.Mock.verify(server);
        },

        'test fetch, listen() error': function () {
            var getweb = Y.Mock(),
                errmsg = "that's gonna leave a mark"
                mojito = {
                    createServer: function() {
                        return {
                        	listen: function(a, b, cb) {
                        	    cb(errmsg);
                        	},
                        	getWebPage: getweb
                        };
                    }
                };

            Y.Mock.expect(getweb, {
                method: 'getWebPage',
                args: [V.String, V.Object, V.Function],
            });

            scraper = new Scraper(mojito);
            scraper.on('error', function(err) {
            	A.areSame(errmsg, err);
            });
            scraper.start({port: 12345, context: ''});
            scraper.fetch({'a':'b'}, function(err) {});
        },

        'test fetch, getWebPage() no error': function () {
            var getweb = Y.Mock(),
                mojito = {
                    createServer: function() {
                        getweb.listen = function(a, b, cb) {cb('')};
                        return getweb;
                    }
                };

            Y.Mock.expect(getweb, {
                method: 'getWebPage',
                args: [V.String, V.Object, V.Function],
            });

            scraper = new Scraper(mojito);

            scraper.start({port: 12345, context: ''});
            scraper.fetch({'a':'b'}, function(err) {});

            Y.Mock.verify(getweb);
        },        

        'test fetch, AND the getWebPage() callback, w/ warning': function () {
            var errmsg = 'HOLEE SHNIKEES',
                uri = "/BROTHERS/DON'T/SHAKE/HANDS/BROTHERS/GOTTA/HUG",
                mojito = {
                    createServer: function() {
                        return {
                            listen: function(a, b, cb) {cb('')},
                            getWebPage: function(key, opts, cb) {
                                cb(errmsg, uri, 'some content');
                            },
                            close: function() {
                            	A.isTrue(true);
                            }
                        }
                    }
                };

            scraper = new Scraper(mojito);
            scraper.on('warn', function(err) {
            	A.areSame('FAILED to get ' + uri, err);
            });

            scraper.start({port: 12345, context: ''});
            scraper.fetch({'aa':'bb'}, function(err) {});
        },        

        'test fetch scraped-one event': function () {
            var errmsg = '',
                uri = '/Ketchup/Popsicle/?eat=no',
                content = 'some content',
                mojito = {
                    createServer: function() {
                        return {
                            listen: function(a, b, cb) {cb('')},
                            getWebPage: function(key, opts, cb) {
                                cb(errmsg, uri, content);
                            },
                            close: function() {
                            	A.isTrue(true);
                            }
                        }
                    }
                };

            scraper = new Scraper(mojito);
            scraper.on('scraped-one', function(cb_uri, cb_content) {
            	A.areSame(undefined, cb_uri);// ??
            	A.areSame(content, cb_content);
            });

            scraper.on('scraping-done', function(err, have, failed) {
            	A.areSame(1, have);
            	A.areSame(0, failed);
            });

            scraper.start({port: 12345, context: ''});
            scraper.fetch({'aa':uri}, function(err) {});
        },        

        'test fetch, scraping-done event is called': function () {
            var errmsg = '',
                uri = '/cheeze/itz/?eat=yes',
                content = 'some content',
                mojito = {
                    createServer: function() {
                        return {
                            listen: function(a, b, cb) {cb('')},
                            getWebPage: function(key, opts, cb) {
                                cb(errmsg, uri, content);
                            },
                            close: function() {
                            	A.isTrue(true);
                            }
                        }
                    }
                };

            scraper = new Scraper(mojito);
            scraper.on('scraping-done', function(err, have, failed) {
            	A.areSame(2, have);
            	A.areSame(0, failed);
            });

            scraper.start({port: 12345, context: ''});
            scraper.fetch({'aab':uri, 'bbb':uri.toUpperCase()}, function(err) {});
        },        
    };

    Y.Test.Runner.add(new Y.Test.Case(cases));
});

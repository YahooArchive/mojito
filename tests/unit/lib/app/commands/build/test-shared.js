/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('mojito-test-extra', 'test', function(Y) {

    var A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,
        cases,

        shared = require(Y.MOJITO_DIR + 'lib/app/commands/build/shared.js'),
        count,
        conf;

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
        name: 'build/shared cases',
        setUp: function() {
            count = 0;
            shared.init({
                copydir: function(file) { count++; return file; },
                copy: function(from, to) { count++; },
                write: function(file, str) { count++; },
            });
        },
        tearDown: function() {},

        'test init': function () {
            A.areSame(0, count);
            A.areSame(undefined, shared.init({}));
            A.areSame(0, count);
        },

        'test copyModule': function () {
            A.areSame(0, count);
            shared.copyModule('package/dir', 'module_name', 'dest/dir');
            A.areSame(1, count);
        },

        'test mapStoreUris modifies buildmap param by reference': function () {
            var buildmap = {},
                storemap = {
                    '/staticpf/top_frame/assets/index.css': '/path/to/app/mojits/top_frame/assets/index.css'
                },
                expected = {
                    '/staticpf/top_frame/assets/index.css?device=iphone': '/staticpf/top_frame/assets/index.css'
                };

            shared.mapStoreUris(buildmap, conf, storemap);
            OA.areEqual(expected, buildmap);
        },

        'test mapStoreUris maps css, js, json files': function () {
            var buildmap = {
                    '/?device=iphone': '/index.html'
                },
                storemap = {
                    '/staticpf/top_frame/assets/index.css': '/path/to/app/mojits/top_frame/assets/index.css',
                    '/staticpf/top_frameBinderIndex.js': '/path/to/app/mojits/top_frame/binders/index.js',
                    '/staticpf/top_frame/package.json': '/path/to/app/mojits/top_frame/package.json',
                    '/staticpf/top_frame/views/index.hb.html': '/path/to/app/mojits/top_frame/views/index.hb.html',
                    '/favicon.ico': '/Users/isao/Repos/mojito/myfork/lib/app/assets/favicon.ico',
                },
                expected = {
                    '/?device=iphone': '/index.html',
                    '/staticpf/top_frame/assets/index.css?device=iphone': '/staticpf/top_frame/assets/index.css',
                    '/staticpf/top_frameBinderIndex.js?device=iphone': '/staticpf/top_frameBinderIndex.js',
                    '/staticpf/top_frame/package.json?device=iphone': '/staticpf/top_frame/package.json'
                };

            shared.mapStoreUris(buildmap, conf, storemap);
            OA.areEqual(expected, buildmap);
        },

        'test mapStoreUris maps copies html, favicon, etc files to build dir': function () {
            var buildmap = {},
                storemap = {
                    '/staticpf/top_frame/assets/index.css': '/path/to/app/mojits/top_frame/assets/index.css',
                    '/staticpf/top_frameBinderIndex.js': '/path/to/app/mojits/top_frame/binders/index.js',
                    '/staticpf/top_frame/package.json': '/path/to/app/mojits/top_frame/package.json',
                    '/staticpf/top_frame/views/index.hb.html': '/path/to/app/mojits/top_frame/views/index.hb.html',
                    '/favicon.ico': '/Users/isao/Repos/mojito/myfork/lib/app/assets/favicon.ico',
                },
                expected = {
                    '/staticpf/top_frame/assets/index.css?device=iphone': '/staticpf/top_frame/assets/index.css',
                    '/staticpf/top_frameBinderIndex.js?device=iphone': '/staticpf/top_frameBinderIndex.js',
                    '/staticpf/top_frame/package.json?device=iphone': '/staticpf/top_frame/package.json'
                };

            A.areSame(0, count);
            shared.mapStoreUris(buildmap, conf, storemap);
            OA.areEqual(expected, buildmap);
            A.areSame(2, count);
        },

        'test mapDefxUris adds definition.json for client mojits': function () {
            var mojits = [
                    {source: {
                        fs: {
                            fullPath: '/Users/isao/Repos/mojito/apps/test50/test50/mojits/top_frame',
                            rootDir: '/Users/isao/Repos/mojito/apps/test50/test50/mojits/top_frame',
                            rootType: 'app',
                            subDir: '.',
                            subDirArray: [ '.' ],
                            isFile: false,
                            ext: '',
                            basename: ''
                        },
                        pkg: { name: 'yahoo.application.test50', version: '0.0.1', depth: 0 } },
                        type: 'mojit',
                        name: 'top_frame',
                        id: 'mojit--top_frame',
                        affinity: { affinity: 'common' },
                        selector: '*',
                        mime: { type: 'application/octet-stream', charset: undefined },
                        url: '/yahoo.application.test50/top_frame'
                    }
                ],
                store = {
                    getResources: function(type, ctx, filter) {return mojits;}
                },
                buildmap = {},
                expected = {'/tunnel/yahoo.application.test50/top_frame/definition.json?device=iphone': '/yahoo.application.test50/top_frame/definition.json'};

            A.areSame(0, count);
            shared.mapDefxUris(buildmap, conf, store);
            OA.areEqual(expected, buildmap);
            A.areSame(0, count);
        },

        'test mapDefxUris does nothing if mojit has no "url"': function () {
            var mojits = [
                    {source: {
                        fs: {
                            fullPath: '/Users/isao/Repos/mojito/apps/test50/test50/mojits/top_frame',
                            rootDir: '/Users/isao/Repos/mojito/apps/test50/test50/mojits/top_frame',
                            rootType: 'app',
                            subDir: '.',
                            subDirArray: [ '.' ],
                            isFile: false,
                            ext: '',
                            basename: ''
                        },
                        pkg: { name: 'yahoo.application.test50', version: '0.0.1', depth: 0 } },
                        type: 'mojit',
                        name: 'top_frame',
                        id: 'mojit--top_frame',
                        affinity: { affinity: 'common' },
                        selector: '*',
                        mime: { type: 'application/octet-stream', charset: undefined },
                        REDACTED_URL: '/yahoo.application.test50/top_frame'
                    }
                ],
                store = {
                    getResources: function(type, ctx, filter) {return mojits;}
                },
                buildmap = {},
                expected = {};

            A.areSame(0, count);
            shared.mapDefxUris(buildmap, conf, store);
            OA.areEqual(expected, buildmap);
            A.areSame(0, count);
        },

        'test mapFunkySpecUris maps app.json specs to default.json files': function () {
            var buildmap = {},
                expected = {
                    '/tunnel/staticpf/frame/specs/default.json?device=iphone': '/staticpf/frame/specs/default.json',
                    '/tunnel/staticpf/tunnelProxy/specs/default.json?device=iphone': '/staticpf/tunnelProxy/specs/default.json'
                };

            A.areSame(0, count);
            shared.mapFunkySpecUris(buildmap, conf);
            OA.areEqual(expected, buildmap);
            A.areSame(0, count);
        },

        'test mapFunkySpecUris handles obscure Livestand mojit specs': function () {
            var buildmap = {},
                expected = {'tunnelpf/staticpf/foo/specs/bar.json?foo=bar': '/staticpf/foo/specs/bar.json'};

            A.areSame(0, count);

            shared.mapFunkySpecUris(buildmap, {staticpf:'staticpf', contextqs: '?foo=bar', tunnelpf:'tunnelpf',app:{specs:{'foo:bar':{}}}});

            OA.areEqual(expected, buildmap);
            A.areSame(0, count);
        },

        'test makeManifest writes a file': function () {
            var buildmap = buildmap = {
                    '/?device=iphone': '/index.html'
                };

            A.areSame(0, count);
            shared.makeManifest(buildmap, 'build/dir', new Date());
            A.areSame(1, count);
        },

        'test mungePage does nothing unless attachManifest, insertCharset, forceRelativePaths are true': function () {
            var uri = '/uri.html',
                oldstr = 'blah blah <html> blah blah',
                newstr;

            A.areSame(0, count);
            newstr = shared.mungePage(conf, uri, oldstr);
            A.areSame(newstr, oldstr);
            A.areSame(1, count);
        },

        'test mungePage does nothing if uri is not *.html': function () {
            var uri = '/uri.css',
                oldstr = 'blah blah <html> blah blah',
                newstr,
                expected = 'blah blah <html manifest="some/uri"> blah blah',
                oldbuildconf = conf.build;

            conf.build = {
                attachManifest: true,
                forceRelativePaths: true,
                insertCharset: 'UTF-8',
            };

            A.areSame(0, count);

            newstr = shared.mungePage(conf, uri, oldstr);

            A.areSame(newstr, oldstr);
            A.areSame(1, count);

            conf.build = oldbuildconf;
        },

        'test mungePage for attachManifest:true': function () {
            var uri = '/uri.html',
                oldstr = 'blah blah <html> blah blah',
                newstr,
                expected = 'blah blah <html manifest="cache.manifest"> blah blah',
                oldbuildconf = conf.build;

            conf.build = {
                attachManifest: true,
                forceRelativePaths: true,
                insertCharset: 'UTF-8',
            };

            A.areSame(0, count);

            newstr = shared.mungePage(conf, uri, oldstr);

            A.areNotSame(newstr, oldstr);
            A.areSame(expected, newstr);
            A.areSame(1, count);

            conf.build = oldbuildconf;
        },

        'test mungePage for attachManifest:true can apply relative path': function () {
            var uri = '/foo/bar/uri.html',
                oldstr = 'blah blah <html> blah blah',
                newstr,
                expected = 'blah blah <html manifest="../../cache.manifest"> blah blah',
                oldbuildconf = conf.build;

            conf.build = {
                attachManifest: true,
                forceRelativePaths: true,
                insertCharset: 'UTF-8',
            };

            A.areSame(0, count);

            newstr = shared.mungePage(conf, uri, oldstr);

            A.areNotSame(newstr, oldstr);
            A.areSame(expected, newstr);
            A.areSame(1, count);

            conf.build = oldbuildconf;
        },

        'test mungePage for forceRelativePaths:true': function () {
            var uri = '/foo/bar/uri.html',
                oldstr = 'blah blah <a href="/foo/bar/baz/bah.html"> blah blah',
                newstr,
                expected = 'blah blah <a href="baz/bah.html"> blah blah',
                oldbuildconf = conf.build;

            conf.build = {
                attachManifest: true,
                forceRelativePaths: true,
                insertCharset: 'UTF-8',
            };

            A.areSame(0, count);

            newstr = shared.mungePage(conf, uri, oldstr);

            A.areNotSame(newstr, oldstr);
            A.areSame(expected, newstr);
            A.areSame(1, count);

            uri = '/foo/bar/baz/bah/uri.html';
            oldstr = 'blah blah <a href="/foo/bah.html"> blah blah';
            expected = 'blah blah <a href="../../../bah.html"> blah blah';
            newstr = shared.mungePage(conf, uri, oldstr);

            A.areNotSame(newstr, oldstr);
            A.areSame(expected, newstr);
            A.areSame(2, count);

            conf.build = oldbuildconf;
        },

        'test mungePage for forceRelativePaths:true with no common root': function () {
            var uri = '/a/b/c/uri.html',
                oldstr = 'blah blah <a href="/foo/bar/baz/bah.html"> blah blah',
                newstr,
                expected = 'blah blah <a href="../../../foo/bar/baz/bah.html"> blah blah',
                oldbuildconf = conf.build;

            conf.build = {
                attachManifest: true,
                forceRelativePaths: true,
                insertCharset: 'UTF-8',
            };

            A.areSame(0, count);

            newstr = shared.mungePage(conf, uri, oldstr);

            A.areNotSame(newstr, oldstr);
            A.areSame(expected, newstr);
            A.areSame(1, count);

            uri = '/foo/bar/baz/bah/uri.html';
            oldstr = 'blah blah <a href="/foo/bah.html"> blah blah';
            expected = 'blah blah <a href="../../../bah.html"> blah blah';
            newstr = shared.mungePage(conf, uri, oldstr);

            A.areNotSame(newstr, oldstr);
            A.areSame(expected, newstr);
            A.areSame(2, count);

            conf.build = oldbuildconf;
        },

        'test mungePage for insertCharset:true': function () {
            var uri = '/',
                oldstr = 'blah blah <head beepoo="boppoo"\npoo> blah blah',
                newstr,
                expected = 'blah blah <head beepoo="boppoo"\npoo>\n<meta charset="UTF-8">\n blah blah',
                oldbuildconf = conf.build;

            conf.build = {
                attachManifest: true,
                forceRelativePaths: true,
                insertCharset: 'UTF-8',
            };

            A.areSame(0, count);

            newstr = shared.mungePage(conf, uri, oldstr);

            A.areNotSame(newstr, oldstr);
            A.areSame(expected, newstr);
            A.areSame(1, count);

            conf.build = oldbuildconf;
        },

        'test mungePage for insertCharset:true simple tag': function () {
            var uri = '/',
                oldstr = 'blah blah <head> blah blah',
                newstr,
                expected = 'blah blah <head>\n<meta charset="UTF-8">\n blah blah',
                oldbuildconf = conf.build;

            conf.build = {
                attachManifest: true,
                forceRelativePaths: true,
                insertCharset: 'UTF-8',
            };

            A.areSame(0, count);

            newstr = shared.mungePage(conf, uri, oldstr);

            A.areNotSame(newstr, oldstr);
            A.areSame(expected, newstr);
            A.areSame(1, count);

            conf.build = oldbuildconf;
        },

        'test mungePage for insertCharset:true does nothing if there already is a charset metatag': function () {
            var uri = '/',
                oldstr = 'blah blah <head boo\npoo> blah blah<meta charset="zippy">',
                newstr,
                oldbuildconf = conf.build;

            conf.build = {
                attachManifest: true,
                forceRelativePaths: true,
                insertCharset: 'UTF-8',
            };

            A.areSame(0, count);

            newstr = shared.mungePage(conf, uri, oldstr);

            A.areSame(newstr, oldstr);
            A.areSame(1, count);

            conf.build = oldbuildconf;
        },

    };

    Y.Test.Runner.add(new Y.Test.Case(cases));
});

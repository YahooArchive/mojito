/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-addon-rs-routes-tests', function(Y, NAME) {

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
        },

        getAppConfig: function(ctx) {
            return { routesFiles: [ 'routes.json' ] };
        },

        getResources: function(env, ctx, filter) {
            var res = {};
            res.source = makeSource(this._config.root, 'app', '.', 'routes.json', true);
            return [ res ];
        },

        cloneObj: function(o) {
            return Y.clone(o);
        },

        getStaticContext: function() {
            return this._config.context || {};
        },

        mergeRecursive: function(dest, src, typeMatch) {
            var p;
            for (p in src) {
                if (src.hasOwnProperty(p)) {
                    // Property in destination object set; update its value.
                    if (src[p] && src[p].constructor === Object) {
                        if (!dest[p]) {
                            dest[p] = {};
                        }
                        dest[p] = this.mergeRecursive(dest[p], src[p]);
                    } else {
                        if (dest[p] && typeMatch) {
                            if (typeof dest[p] === typeof src[p]) {
                                dest[p] = src[p];
                            }
                        } else {
                            dest[p] = src[p];
                        }
                    }
                }
            }
            return dest;
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


    function makeSource(dir, dirType, subdir, file, isFile) {
        var source = {
            fs: {
                fullPath: libpath.join(dir, subdir, file),
                rootDir: dir,
                rootType: dirType,
                subDir: subdir,
                subDirArray: subdir.split('/'),
                isFile: isFile,
                ext: libpath.extname(file)
            },
            pkg: {
                name: 'unittest',
                version: '999.666.999',
                depth: 999
            }
        };
        source.fs.basename = libpath.basename(file, source.fs.ext);
        return source;
    }


    suite.add(new YUITest.TestCase({

        name: 'config rs addon tests',

        'read routes': function() {
            var fixtures = libpath.join(__dirname, '../../../../fixtures/store');
            var store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.config, { appRoot: fixtures, mojitoRoot: mojitoRoot } );
            store.plug(Y.mojito.addons.rs.routes, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            store.routes.read('server', {}, function(err, have) {
                var want = {
                    flickr_by_page: {
                        verbs: [ "get" ],
                        path: "/flickr/page/:page/image/:image",
                        call: "flickr.index"
                    },
                    flickr_base: {
                        verbs: [ "get" ],
                        path: "/flickr",
                        param: "page=1&image=0",
                        call: "flickr.index"
                    },
                    detail: undefined
                };
                cmp(have, want);
            });
        }


    }));

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: [
    'base',
    'oop',
    'addon-rs-config',
    'addon-rs-routes'
]});

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/

YUI.add('addon-rs-yui', function(Y, NAME) {

    var libfs = require('fs'),
        libpath = require('path'),
        libvm = require('vm');

    function RSAddonYUI() {
        RSAddonYUI.superclass.constructor.apply(this, arguments);
    }
    RSAddonYUI.NS = 'yui';
    RSAddonYUI.ATTRS = {};

    Y.extend(RSAddonYUI, Y.Plugin.Base, {

        initializer: function(config) {
            this.rs = config.host;
            this.appRoot = config.appRoot;
            this.mojitoRoot = config.mojitoRoot;
            this.afterHostMethod('findResourceByConvention', this.findResourceByConvention, this);
            this.beforeHostMethod('parseResource', this.parseResource, this);
            this.beforeHostMethod('addResourceVersion', this.addResourceVersion, this);
            this.onHostEvent('getMojitTypeDetails', this.getMojitTypeDetails, this);
        },


        destructor: function() {
            // TODO:  needed to break cycle so we don't leak memory?
            this.rs = null;
        },


        findResourceByConvention: function(source, mojitType) {
            var fs = source.fs;

            if (!fs.isFile) {
                return;
            }
            if ('.js' !== fs.ext) {
                return;
            }

            if (fs.subDirArray.length >= 1 && ('autoload' === fs.subDirArray[0] || 'yui_modules' === fs.subDirArray[0])) {
                return new Y.Do.AlterReturn(null, {
                    type: 'yui-module',
                    skipSubdirParts: 1
                });
            }

            if (fs.subDirArray.length >= 1 && 'lang' === fs.subDirArray[0]) {
                return new Y.Do.AlterReturn(null, {
                    type: 'yui-lang',
                    skipSubdirParts: 1
                });
            }
        },


        parseResource: function(source, type, subtype, mojitType) {
            var fs = source.fs,
                baseParts,
                res;

            if ('yui-lang' === type) {
                res = {
                    source: source,
                    mojit: mojitType,
                    type: 'yui-lang',
                    affinity: 'common',
                    selector: '*'
                };
                if (!res.yui) {
                    res.yui = {};
                }
                if (fs.basename === mojitType) {
                    res.yui.lang = '';
                } else if (mojitType === fs.basename.substr(0, mojitType.length)) {
                    res.yui.lang = fs.basename.substr(mojitType.length + 1);
                } else {
                    Y.log('invalid YUI lang file format. skipping ' + fs.fullPath, 'error', NAME);
                }
                res.name = res.yui.lang;
                res.id = [res.type, res.subtype, res.name].join('-');
                return new Y.Do.Halt(null, res);
            }

            if ('yui-module' === type) {
                baseParts = fs.basename.split('.');
                res = {
                    source: source,
                    mojit: mojitType,
                    type: 'yui-module',
                    affinity: 'server',
                    selector: '*'
                };
                if (baseParts.length >= 3) {
                    res.selector = baseParts.pop();
                }
                if (baseParts.length >= 2) {
                    res.affinity = baseParts.pop();
                }
                if (baseParts.length !== 1) {
                    Y.log('invalid yui-module filename. skipping ' + fs.fullPath, 'warn', NAME);
                    return;
                }
                this._parseYUIModule(res);
                res.name = res.yui.name;
                res.id = [res.type, res.subtype, res.name].join('-');
                return new Y.Do.Halt(null, res);
            }
        },


        addResourceVersion: function(res) {
            if ('.js' !== res.source.fs.ext) {
                return;
            }
            if (res.yui && res.yui.name) {
                // work done already
                return;
            }
            // ASSUMPTION:  no app-level resources are YUI modules
            if (!res.mojit) {
                return;
            }
            this._parseYUIModule(res);
        },


        getMojitTypeDetails: function(evt) {
            var dest = evt.mojit,
                ress,
                r,
                res;
            ress = this.rs.getResources(evt.args.env, evt.args.ctx, {mojit: evt.args.mojitType});
            for (r = 0; r < ress.length; r += 1) {
                res = ress[r];
                if (res.type === 'binder') {
                    if (!dest.views[res.name]) {
                        dest.views[res.name] = {};
                    }
                    dest.views[res.name]['binder-module'] = res.yui.name;
                }
                if (res.type === 'controller') {
                    dest['controller-module'] = res.yui.name;
                }
            }
        },


        _parseYUIModule: function(res) {
            var file,
                ctx,
                yui = {};
            file = libfs.readFileSync(res.source.fs.fullPath, 'utf8');
            ctx = {
                console: {
                    log: function() {}
                },
                window: {},
                document: {},
                YUI: {
                    add: function(name, fn, version, meta) {
                        yui.name = name;
                        yui.version = version;
                        yui.meta = meta || {};
                    }
                }
            };
            try {
                libvm.runInNewContext(file, ctx, res.source.fs.fullPath);
            } catch (e) {
                yui = null;
                Y.log(e.message + '\n' + e.stack, 'error', NAME);
            }
            if (yui) {
                res.yui = Y.merge(res.yui || {}, yui);
            }
        }


    });
    Y.namespace('mojito.addons.rs');
    Y.mojito.addons.rs.yui = RSAddonYUI;

}, '0.0.1', { requires: ['plugin', 'oop']});

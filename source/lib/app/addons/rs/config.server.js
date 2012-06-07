/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/

YUI.add('addon-rs-config', function(Y, NAME) {

    var libfs = require('fs'),
        libpath = require('path'),
        libycb = require(libpath.join(__dirname, '../../../libs/ycb'));

    function RSAddonConfig() {
        RSAddonConfig.superclass.constructor.apply(this, arguments);
    }
    RSAddonConfig.NS = 'config';
    RSAddonConfig.ATTRS = {};

    Y.extend(RSAddonConfig, Y.Plugin.Base, {

        initializer: function(config) {
            this.rs = config.host;
            this.appRoot = config.appRoot;
            this.mojitoRoot = config.mojitoRoot;
            this.afterHostMethod('findResourceByConvention', this.findResourceByConvention, this);
            this.beforeHostMethod('parseResource', this.parseResource, this);

            this._jsonCache = {};   // fullPath: contents as JSON object
            this._ycbCache = {};    // fullPath: YCB config object
            this._ycbDims = this._readYcbDimensions();
        },


        destructor: function() {
            // TODO:  needed to break cycle so we don't leak memory?
            this.rs = null;
        },


        getDimensions: function() {
            return this.rs.cloneObj(this._ycbDims);
        },


        /**
         * Reads and parses a JSON file
         *
         * @method readConfigJSON
         * @param fullPath {string} path to JSON file
         * @return {mixed} contents of JSON file
         */
        // TODO:  async interface
        readConfigJSON: function(fullPath) {
            var json,
                contents;
            if (!libpath.existsSync(fullPath)) {
                return {};
            }
            json = this._jsonCache[fullPath];
            if (!json) {
                try {
                    contents = libfs.readFileSync(fullPath, 'utf-8');
                    json = JSON.parse(contents);
                } catch (e) {
                    throw new Error('Error parsing JSON file: ' + fullPath);
                }
                this._jsonCache[fullPath] = json;
            }
            return this.rs.cloneObj(json);
        },


        /**
         * reads a configuration file that is in YCB format
         *
         * @method readConfigYCB
         * @param ctx {object} runtime context
         * @param fullPath {string} path to the YCB file
         * @return {object} the contextualized configuration
         */
        // TODO:  async interface
        readConfigYCB: function(fullPath, ctx) {
            var cacheKey,
                json,
                ycb;

            ctx = this.rs.mergeRecursive(this.rs.getStaticContext(), ctx);

            ycb = this._ycbCache[fullPath];
            if (!ycb) {
                json = this.readConfigJSON(fullPath);
                json = this._ycbDims.concat(json);
                ycb = new libycb.Ycb(json);
                this._ycbCache[fullPath] = ycb;
            }
            return ycb.read(ctx, {});
        },


        findResourceByConvention: function(source, mojitType) {
            var fs = source.fs,
                use = false;

            // we only care about files
            if (!fs.isFile) {
                return;
            }
            // we don't care about files in subdirectories
            if ('.' !== fs.subDir) {
                return;
            }
            // we only care about json files
            if ('.json' !== fs.ext) {
                return;
            }
            // use package.json for the app and the mojit
            if ('package' === fs.basename && 'bundle' !== fs.rootType) {
                use = true;
            }
            // use all configs in the application
            if ('app' === fs.rootType) {
                use = true;
            }
            // use configs from non-shared mojit resources
            if (mojitType && 'shared' !== mojitType) {
                use = true;
            }
            if (!use) {
                return;
            }

            return new Y.Do.AlterReturn(null, {
                type: 'config'
            });
        },


        parseResource: function(source, type, subtype, mojitType) {
            var baseParts,
                res;

            if ('config' !== type) {
                return;
            }

            baseParts = source.fs.basename.split('.');
            res = {
                source: source,
                type: 'config',
                affinity: 'common',
                selector: '*'
            };
            if ('app' !== source.fs.rootType) {
                res.mojit = mojitType;
            }
            if (baseParts.length !== 1) {
                Y.log('invalid config filename. skipping ' + source.fs.fullPath, 'warn', NAME);
                return;
            }
            res.name = libpath.join(source.fs.subDir, baseParts.join('.'));
            res.id = [res.type, res.subtype, res.name].join('-');
            return new Y.Do.Halt(null, res);
        },


        /**
         * Read the application's dimensions.json file for YCB processing. If not
         * available, fall back to the framework's default dimensions.json.
         *
         * @method _readYcbDimensions
         * @return {array} contents of the dimensions.json file
         * @private
         */
        _readYcbDimensions: function() {
            var path = libpath.join(this.appRoot, 'dimensions.json');
            if (!libpath.existsSync(path)) {
                path = libpath.join(this.mojitoRoot, 'dimensions.json');
            }
            return this.readConfigJSON(path);
        }


    });
    Y.namespace('mojito.addons.rs');
    Y.mojito.addons.rs.config = RSAddonConfig;

}, '0.0.1', { requires: ['plugin', 'oop']});

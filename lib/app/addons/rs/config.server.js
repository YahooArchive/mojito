/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true, stupid:true*/
/*global YUI*/


/**
 * The <strong>Resource Store</strong> is a Y.Base -- a host for Y.Plugins.
 * Each Addon provides additional functions through a namespace that is
 * attached directly to the resource store.
 * @module ResourceStoreAddon
 */


/**
 * @class RSAddonConfig
 * @extension ResourceStore.server
 */
YUI.add('addon-rs-config', function(Y, NAME) {

    var libfs = require('fs'),
        libpath = require('path'),
        existsSync = libfs.existsSync || libpath.existsSync,
        libycb = require('ycb'),
        libyaml = require('js-yaml');

    function RSAddonConfig() {
        RSAddonConfig.superclass.constructor.apply(this, arguments);
    }
    RSAddonConfig.NS = 'config';

    Y.extend(RSAddonConfig, Y.Plugin.Base, {

        /**
         * This methods is part of Y.Plugin.Base.  See documentation for that for details.
         * @method initializer
         * @param {object} config Configuration object as per Y.Plugin.Base
         * @return {nothing}
         */
        initializer: function(config) {
            this.appRoot = config.appRoot;
            this.mojitoRoot = config.mojitoRoot;
            this.afterHostMethod('findResourceVersionByConvention', this.findResourceVersionByConvention, this);
            this.beforeHostMethod('parseResourceVersion', this.parseResourceVersion, this);

            this._jsonCache = {};   // fullPath: contents as JSON object
            this._ycbCache = {};    // fullPath: context: YCB config object
            this._ycbDims = this._readYcbDimensions();
        },


        /**
         * Returns the YCB dimensions for the application.
         * @method getDimensions
         * @return {object} the YCB dimensions structure for the app
         */
        getDimensions: function() {
            return Y.mojito.util.copy(this._ycbDims);
        },

        /**
         * Same as readConfigSync except the result is cached for future calls.
         * @method readConfigSimple
         * @param {string} fullPath path to JSON or YAML file
         * @return {user-defined} contents of file as an object
         */
        readConfigSimple: function(fullPath) {
            var json;
            json = this._jsonCache[fullPath];
            if (!json) {
                json = this.readConfigSync(fullPath);
                this._jsonCache[fullPath] = json;
            }

            return Y.mojito.util.copy(json);
        },

        /**
         * Reads and parses a JSON or YAML structured file.
         * @method readConfigSync
         * @param {string} fullPath path to JSON or YAML file
         * @return {user-defined} contents of file as an object
         */
        readConfigSync: function (filePath) {

            var extensions = ['.yml', '.yaml', '.json'],
                i,
                json = false,
                raw,
                obj = {};

            if (libpath.extname(filePath)) {
                filePath = filePath.slice(0, libpath.extname(filePath).length * -1);
            }

            for (i = extensions.length - 1; i >= 0; i -= 1) {
                try {
                    raw = libfs.readFileSync(filePath + extensions[i], 'utf8');
                    try {
                        if (i === 2) { // json
                            obj = JSON.parse(raw);
                            json = true;
                        } else { // yaml or yml
                            obj = libyaml.load(raw);
                            if (json) {
                                Y.log(filePath + extensions[2] + ' exists. But ' + extensions[i] + ' file will be used', 'warn', NAME);
                            }
                        }
                    } catch (parseErr) {
                        throw new Error(parseErr);
                    }
                } catch (err) {
                    if (err.errno !== 34) { // if the error was not "no such file or directory" report it
                        throw new Error("Error parsing file: " + filePath + extensions[i] + "\n" + err);
                    }
                }
            }
            return obj;
        },


        /**
         * Reads a configuration file that is in YCB format.
         * @method readConfigYCB
         * @param {object} ctx runtime context
         * @param {string} fullPath path to the YCB file
         * @return {object} the contextualized configuration
         */
        // TODO:  async interface
        readConfigYCB: function(fullPath, ctx) {
            var store = this.get('host'),
                cacheKey,
                json,
                ycb;

            ctx = store.mergeRecursive(store.getStaticContext(), ctx);

            store.validateContext(ctx);

            if (!this._ycbCache[fullPath]) {
                this._ycbCache[fullPath] = {};
            }

            cacheKey = Y.JSON.stringify(ctx);
            ycb = this._ycbCache[fullPath][cacheKey];
            if (!ycb) {
                json = this.readConfigSimple(fullPath);
                json = this._ycbDims.concat(json);
                ycb = libycb.read(json, ctx);
                this._ycbCache[fullPath][cacheKey] = ycb;
            }
            return Y.mojito.util.copy(ycb);
        },


        /**
         * Using AOP, this is called after the ResourceStore's version.
         * @method findResourceVersionByConvention
         * @param {object} source metadata about where the resource is located
         * @param {string} mojitType name of mojit to which the resource likely belongs
         * @return {object||null} for config file resources, returns metadata signifying that
         */
        findResourceVersionByConvention: function(source, mojitType) {
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
            // we only care about json or yaml files
            if ('.json' !== fs.ext && '.yaml' !== fs.ext && '.yml' !== fs.ext) {
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


        /**
         * Using AOP, this is called before the ResourceStore's version.
         * @method parseResourceVersion
         * @param {object} source metadata about where the resource is located
         * @param {string} type type of the resource
         * @param {string} subtype subtype of the resource
         * @param {string} mojitType name of mojit to which the resource likely belongs
         * @return {object||null} for config file resources, returns the resource metadata
         */
        parseResourceVersion: function(source, type, subtype, mojitType) {
            var baseParts,
                res;

            if ('config' !== type) {
                return;
            }

            baseParts = source.fs.basename.split('.');
            if (baseParts.length !== 1) {
                Y.log('invalid config filename. skipping ' + source.fs.fullPath, 'warn', NAME);
                return;
            }
            res = {
                source: source,
                type: 'config',
                affinity: 'common',
                selector: '*'
            };
            if ('app' !== source.fs.rootType) {
                res.mojit = mojitType;
            }
            res.name = libpath.join(source.fs.subDir, baseParts.join('.'));
            res.id = [res.type, res.subtype, res.name].join('-');
            return new Y.Do.Halt(null, res);
        },


        /**
         * Read the application's dimensions.json file for YCB processing. If not
         * available, fall back to the framework's default dimensions.json.
         * @private
         * @method _readYcbDimensions
         * @return {array} contents of the dimensions.json file
         */
        _readYcbDimensions: function() {
            var path = libpath.join(this.appRoot, 'dimensions.json');
            if (!existsSync(path)) {
                path = libpath.join(this.mojitoRoot, 'dimensions.json');
            }
            return this.readConfigSimple(path);
        }


    });
    Y.namespace('mojito.addons.rs');
    Y.mojito.addons.rs.config = RSAddonConfig;

}, '0.0.1', { requires: ['plugin', 'oop', 'json-parse', 'mojito-util']});

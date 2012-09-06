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
        libycb = require('ycb');

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
            this._ycbCache = {};    // fullPath: YCB config object
            this._ycbDims = this._readYcbDimensions();
        },


        /**
         * Returns the YCB dimensions for the application.
         * @method getDimensions
         * @return {object} the YCB dimensions structure for the app
         */
        getDimensions: function() {
            return Y.clone(this._ycbDims, true);
        },


        /**
         * Reads and parses a JSON file.
         * @method readConfigJSON
         * @param {string} fullPath path to JSON file
         * @return {user-defined} contents of JSON file
         */
        // TODO:  async interface
        readConfigJSON: function(fullPath) {
            var json,
                contents;
            if (!existsSync(fullPath)) {
                return {};
            }
            json = this._jsonCache[fullPath];
            if (!json) {
                try {
                    contents = libfs.readFileSync(fullPath, 'utf-8');
                    json = Y.JSON.parse(contents);
                } catch (e) {
                    throw new Error('Error parsing JSON file: ' + fullPath);
                }
                this._jsonCache[fullPath] = json;
            }
            return Y.clone(json, true);
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

            ycb = this._ycbCache[fullPath];
            if (!ycb) {
                json = this.readConfigJSON(fullPath);
                json = this._ycbDims.concat(json);
                ycb = new libycb.Ycb(json);
                this._ycbCache[fullPath] = ycb;
            }
            return ycb.read(ctx, {});
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
            return this.readConfigJSON(path);
        }


    });
    Y.namespace('mojito.addons.rs');
    Y.mojito.addons.rs.config = RSAddonConfig;

}, '0.0.1', { requires: ['plugin', 'oop', 'json-parse']});

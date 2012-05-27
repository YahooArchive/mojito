/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint
    anon:true, sloppy:true, regexp: true, continue: true, nomen:true, node:true
*/


YUI.add('resource-store', function(Y, NAME) {

    var libfs = require('fs'),
        libglob = require('./glob'),
        libpath = require('path'),
        libqs = require('querystring'),
        libvm = require('vm'),
        libwalker = require('./package-walker.server'),
        libycb = require('./libs/ycb'),

        isNotAlphaNum = /[^a-zA-Z0-9]/,

        mojitoRoot = __dirname,

        CONVENTION_SUBDIR_TYPES = {
            // subdir: type
            'actions':  'action',
            'binders':  'binder',
            'commands': 'command',
            'middleware': 'middleware',
            'models':   'model',
            'views':    'view'
        },
        CONVENTION_SUBDIR_TYPE_IS_JS = {
            'action': true,
            'binder': true,
            'model': true
        };


    // The Affinity object is to manage the use of the affinity string in
    // filenames.  Some files have affinities that have multiple parts
    // (e.g. "server-tests").
    function Affinity(affinity) {
        var parts;
        if (affinity.indexOf('-') === -1) {
            this.affinity = affinity;
        } else {
            parts = affinity.split('-');
            this.affinity = parts[0];
            this.type = parts[1];
        }
    }
    Affinity.prototype = {
        toString: function() {
            return this.affinity;
        }
    };



    function ResourceStore(config) {
        ResourceStore.superclass.constructor.apply(this, arguments);
    }
    ResourceStore.NAME = 'ResourceStore';
    ResourceStore.ATTRS = {};


    Y.extend(ResourceStore, Y.Base, {

        initializer: function(cfg) {
            this._config = cfg;
            this._jsonCache = {};   // fullPath: contents as JSON object
            this._ycbCache = {};    // fullPath: context: YCB config object

            Y.Object.each(Y.mojito.addons.rs, function(fn, name) {
                this.plug(fn, { appRoot:cfg.root, mojitoRoot:mojitoRoot });
            }, this);
        },
        destructor: function() {},


        getStaticContext: function() {
            return this.cloneObj(this._config.context);
        },


        getStaticAppConfig: function() {
            return this.cloneObj(this._appConfigStatic);
        },


        getAppConfig: function(ctx) {
            var appConfig,
                ycb;

            if (this._appConfigStatic && (!ctx || !Object.keys(ctx).length)) {
                return this.cloneObj(this._appConfigStatic);
            }

            // start with the base
            appConfig = this.cloneObj(this._fwConfig.appConfigBase);

            // apply the read values from the file
            ycb = this.config.readConfigYCB(libpath.join(this._config.root, 'application.json'), ctx);
            this.mergeRecursive(appConfig, ycb);

            // apply the passed-in overrides
            this.mergeRecursive(appConfig, this.cloneObj(this._config.appConfig));

            return appConfig;
        },


        preload: function() {
            this._fwConfig = this.config.readConfigJSON(libpath.join(mojitoRoot, 'config.json'));
            this._appConfigStatic = this.getAppConfig({});
            this._preloadMeta();
            this.resolveResourceVersions();
        },


        /**
         * preload metadata about all resources in the application (and Mojito framework)
         *
         * @method _preloadMeta
         * @return {nothing} work down via other called methods
         * @private
         */
        _preloadMeta: function() {
            var me = this,
                walker,
                walkedMojito = false,
                dir,
                info;
            walker = new libwalker.BreadthFirst(this._config.root);
            walker.walk(function(err, info) {
                if (err) {
                    throw err;
                }
                if ('mojito' === info.pkg.name) {
                    walkedMojito = true;
                }
                me.preloadPackage(info);
            });

            // user might not have installed mojito as a dependency of their
            // application.  (they -should- have but might not have.)
            // FUTURE:  instead walk -all- global packages?
            if (!walkedMojito) {
                dir = libpath.join(mojitoRoot, '..');
                info = {
                    depth: 999,
                    parents: [],
                    dir: dir
                };
                info.pkg = this.config.readConfigJSON(libpath.join(dir, 'package.json'));

                // special case for weird packaging situations
                if (!Object.keys(info.pkg).length) {
                    info.dir = mojitoRoot;
                    info.pkg = {
                        name: 'mojito',
                        version: '0.666.666',
                        yahoo: {
                            mojito: {
                                type: 'bundle',
                                location: 'app'
                            }
                        }
                    };
                }

                this.preloadPackage(info);
            }
        },


        /**
         * preloads metadata about resources in a package
         * (but not subpackages in its node_modules/)
         *
         * @method preloadPackage
         * @param info {object} metadata about the package
         * @return {nothing} work down via other called methods
         */
        preloadPackage: function(info) {
            var dir,
                pkg;
            // FUTURE:  use info.inherit to scope mojit dependencies
            /*
            console.log('--PACKAGE-- ' + info.depth + ' ' + info.pkg.name + '@' + info.pkg.version
                    + ' \t' + (info.pkg.yahoo && info.pkg.yahoo.mojito && info.pkg.yahoo.mojito.type)
                    + ' \t[' + info.parents.join(',') + ']'
            //      + ' \t-- ' + JSON.stringify(info.inherit)
            );
            */
            pkg = {
                name: info.pkg.name,
                version: info.pkg.version,
                depth: info.depth
            };
            if (0 === info.depth) {
                // the actual application is handled specially
                this.preloadApp(pkg);
                return;
            }
            if (!info.pkg.yahoo || !info.pkg.yahoo.mojito) {
                return;
            }
            switch (info.pkg.yahoo.mojito.type) {
            case 'bundle':
                dir = libpath.join(info.dir, info.pkg.yahoo.mojito.location);
                this._preloadDirBundle(dir, pkg);
                break;
            case 'mojit':
                dir = libpath.join(info.dir, info.pkg.yahoo.mojito.location);
                this.preloadDirMojit(dir, 'pkg', pkg);
                break;
            default:
                Y.log('Unknown package type "' + info.pkg.yahoo.mojito.type + '"', 'warn', NAME);
                break;
            }
        },


        /**
         * preloads metadata about resources in the application directory
         * (but not node_modules/)
         *
         * @method preloadApp
         * @param pkg {object} metadata (name and version) about the app's package
         * @return {nothing} work down via other called methods
         */
        preloadApp: function(pkg) {
            var ress,
                r,
                res,
                list,
                i;

            ress = this._findResourcesByConvention(this._config.root, 'app', pkg, 'shared');
            for (r = 0; r < ress.length; r += 1) {
                res = ress[r];
                if ('mojit' !== res.type) {
                    // ignore app-level mojits found by convention, since they'll be loaded below
                    this.addResourceVersion(ress[r]);
                }
            }

            // load mojitsDirs
            list = this._globList(this._config.root, this._appConfigStatic.mojitsDirs);
            for (i = 0; i < list.length; i += 1) {
                this._preloadDirMojits(list[i], 'app', pkg);
            }

            // load mojitDirs
            list = this._globList(this._config.root, this._appConfigStatic.mojitDirs || []);
            for (i = 0; i < list.length; i += 1) {
                this.preloadDirMojit(list[i], 'app', pkg);
            }
        },


        /**
         * preloads metadata about resource in a directory
         *
         * @method _preloadDirBundle
         * @param dir {string} directory path
         * @param pkg {object} metadata (name and version) about the package
         * @return {nothing} work down via other called methods
         * @private
         */
        _preloadDirBundle: function(dir, pkg) {
            var ress,
                r,
                res;
            // FUTURE:  support configuration too

            ress = this._findResourcesByConvention(dir, 'bundle', pkg, 'shared');
            for (r = 0; r < ress.length; r += 1) {
                res = ress[r];
                this.addResourceVersion(res);
            }
            this._preloadDirMojits(libpath.join(dir, 'mojits'), 'bundle', pkg);
        },


        /**
         * preloads a directory containing many mojits
         *
         * @method _preloadDirMojits
         * @param dir {string} directory path
         * @param dirType {string} type represented by the "dir" argument.  values are "app", "bundle", "pkg", or "mojit"
         * @param pkg {object} metadata (name and version) about the package
         * @return {nothing} work down via other called methods
         * @private
         */
        _preloadDirMojits: function(dir, dirType, pkg) {
            var i,
                realDirs,
                children,
                childName,
                childPath;

            if ('/' !== dir.charAt(0)) {
                dir = libpath.join(this._config.root, dir);
            }

            if (!libpath.existsSync(dir)) {
                return;
            }

            children = this._sortedReaddirSync(dir);
            for (i = 0; i < children.length; i += 1) {
                childName = children[i];
                if ('.' === childName.substring(0, 1)) {
                    continue;
                }
                childPath = libpath.join(dir, childName);
                this.preloadDirMojit(childPath, dirType, pkg);
            }
        },


        /**
         * preloads a directory that represents a single mojit
         *
         * @method preloadDirMojit
         * @param dir {string} directory path
         * @param dirType {string} type represented by the "dir" argument.  values are "app", "bundle", "pkg", or "mojit"
         * @param pkg {object} metadata (name and version) about the package
         * @return {nothing} work down via other called methods
         * @private
         */
        preloadDirMojit: function(dir, dirType, pkg) {
            var mojitType,
                packageJson,
                definitionJson,
                ress,
                r,
                res;

            if ('/' !== dir.charAt(0)) {
                dir = libpath.join(this._config.root, dir);
            }

            if (!libpath.existsSync(dir)) {
                return;
            }

            mojitType = libpath.basename(dir);
            packageJson = this.config.readConfigJSON(libpath.join(dir, 'package.json'));
            if (packageJson) {
                if (packageJson.name) {
                    mojitType = packageJson.name;
                }
                // FUTURE:  check NPM "engine"
                // TODO:  register mojit's package.json as a static asset, in "static handler" plugin
            }
            // TODO:  this._mojitPaths[mojitType] = dir;
            // replace with something more generic (some kind of "mojitType attributes" store)

            definitionJson = this.config.readConfigYCB(libpath.join(dir, 'definition.json'), {});
            if (definitionJson.appLevel) {
                mojitType = 'shared';
            }

            res = {
                source: {
                    fs: {
                        fullPath: dir,
                        rootDir: dir,
                        rootType: dirType,
                        subDir: '.',
                        subDirArray: ['.'],
                        basename: libpath.basename(dir),
                        isFile: false,
                        ext: null
                    },
                    pkg: pkg
                },
                type: 'mojit',
                subtype: null,
                name: mojitType,
                id: 'mojit--' + mojitType,
                mojit: null,
                affinity: 'common',
                selector: '*'
            };
            this.addResourceVersion(res);

            ress = this._findResourcesByConvention(dir, 'mojit', pkg, mojitType);
            for (r = 0; r < ress.length; r += 1) {
                res = ress[r];
                // just in case, only add those resources that really do belong to us
                if (res.mojit === mojitType) {
                    this.addResourceVersion(res);
                }
                // FUTURE:  else warn?
            }
        },


        findResourceByConvention: function(source, mojitType) {
            var fs = source.fs,
                baseParts = fs.basename.split('.'),
                type;

            if (!fs.isFile && '.' === fs.subDir && CONVENTION_SUBDIR_TYPES[fs.basename]) {
                return true;
            }
            type = CONVENTION_SUBDIR_TYPES[fs.subDirArray[0]];
            if (!fs.isFile && type) {
                return true;
            }
            if (fs.isFile && type && fs.subDirArray.length >= 1) {
                if (CONVENTION_SUBDIR_TYPE_IS_JS[type] && '.js' !== fs.ext) {
                    return false;
                }
                return {
                    type: type,
                    skipSubdirParts: 1
                };
            }

            // special case:  addons
            if (!fs.isFile && '.' === fs.subDir && 'addons' === fs.basename) {
                return true;
            }
            if (!fs.isFile && fs.subDirArray.length < 2 && 'addons' === fs.subDirArray[0]) {
                return true;
            }
            if (fs.isFile && fs.subDirArray.length >= 1 && 'addons' === fs.subDirArray[0]) {
                if ('.js' !== fs.ext) {
                    return false;
                }
                return {
                    type: 'addon',
                    subtype: fs.subDirArray[1],
                    skipSubdirParts: 2
                };
            }

            // special case:  archetypes
            if (!fs.isFile && '.' === fs.subDir && 'archetypes' === fs.basename) {
                return true;
            }
            if (!fs.isFile && fs.subDirArray.length < 2 && 'archetypes' === fs.subDirArray[0]) {
                return true;
            }
            if (!fs.isFile && fs.subDirArray.length == 2 && 'archetypes' === fs.subDirArray[0]) {
                return {
                    type: 'archetype',
                    subtype: fs.subDirArray[1],
                    skipSubdirParts: 2
                };
            }

            // special case:  assets
            if (!fs.isFile && '.' === fs.subDir && 'assets' === fs.basename) {
                return true;
            }
            if (!fs.isFile && 'assets' === fs.subDirArray[0]) {
                return true;
            }
            if (fs.isFile && 'assets' === fs.subDirArray[0] && fs.subDirArray.length >= 1) {
                return {
                    type: 'asset',
                    subtype: fs.ext.substr(1),
                    skipSubdirParts: 1
                };
            }

            // special case:  controller
            if (fs.isFile && '.' === fs.subDir && 'controller' === baseParts[0]) {
                if ('.js' !== fs.ext) {
                    return false;
                }
                return {
                    type: 'controller'
                };
            }

            // special case:  mojit
            if (!fs.isFile && '.' === fs.subDir && 'mojits' === fs.basename) {
                // don't bother finding mojits here, since they're loaded explicitly in
                // the app and bundle in different ways
                return false;
            }

            // unknown path
            return true;
        },


        parseResource: function(source, type, subtype, mojitType) {
            var fs = source.fs,
                baseParts = fs.basename.split('.'),
                res;

            // app-level resources
            if ('archetype' === type || 'command' === type || 'middleware' === type) {
                if ('mojit' === fs.rootType) {
                    Y.log(type + ' cannot be defined in a mojit. skipping ' + fs.fullPath, 'warn', NAME);
                    return false;
                }
                res = {
                    source: source,
                    type: type,
                    subtype: subtype,
                    name: fs.basename,
                    mojit: null,
                    affinity: 'server',
                    selector: '*'
                };
                res.id = [res.type, res.subtype, res.name].join('-');
                return res;
            }

            // mojit parts with format {name}.{affinity}.{selector}
            if (
                'action' === type || 
                'addon' === type || 
                'controller' === type ||
                'model' === type
            ) {
                res = {
                    source: source,
                    type: type,
                    subtype: subtype,
                    mojit: mojitType,
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
                    Y.log('invalid ' + type + ' filename. skipping ' + fs.fullPath, 'warn', NAME);
                    return false;
                }
                res.name = libpath.join(fs.subDirArray.slice(1).join('/'), baseParts.join('.'));
                res.id = [res.type, res.subtype, res.name].join('-');
                return res;
            }

            // mojit parts with format {name}.{selector}
            if ('asset' === type || 'binder' === type) {
                res = {
                    source: source,
                    type: type,
                    subtype: subtype,
                    mojit: mojitType,
                    affinity: 'common',
                    selector: '*'
                };
                if (baseParts.length >= 2) {
                    res.selector = baseParts.pop();
                }
                if (baseParts.length !== 1) {
                    Y.log('invalid ' + type + ' filename. skipping ' + fs.fullPath, 'warn', NAME);
                    return false;
                }
                res.name = libpath.join(fs.subDirArray.slice(1).join('/'), baseParts.join('.'));
                res.id = [res.type, res.subtype, res.name].join('-');
                return res;
            }

            // special case:  view
            if ('view' === type) {
                res = {
                    source: source,
                    type: type,
                    subtype: subtype,
                    mojit: mojitType,
                    viewOutputFormat: fs.ext.substr(1),
                    viewEngine: baseParts.pop(),
                    affinity: 'common',
                    selector: '*'
                };
                if (baseParts.length >= 2) {
                    res.selector = baseParts.pop();
                }
                if (baseParts.length !== 1) {
                    Y.log('invalid view filename. skipping ' + fs.fullPath, 'warn', NAME);
                    return false;
                }
                res.name = libpath.join(fs.subDirArray.slice(1).join('/'), baseParts.join('.'));
                res.id = [res.type, res.subtype, res.name].join('-');
                return res;
            }

            // just ignore unknown types
            return null;
        },


        addResourceVersion: function(res) {
            console.log('---------------------------------------------- TODO addResourceVersion -- '
                + res.source.fs.rootType + ' ' + res.mojit
                + ' ' + res.id
                + '    ' + res.affinity + ':' + res.selector
            );
            //console.log(res);
        },


        resolveResourceVersions: function() {
            console.log('---------------------------------------------- TODO resolveResourceVersions');
            // OLD:  _cookdown
        },


        /**
         * Finds resources based on our conventions
         * -doesn't- load mojits or their contents.  That's done elsewhere.
         *
         * @method _findResourcesByConvention
         * @param dir {string} directory from which to find resources
         * @param dirType {string} type represented by the "dir" argument.  values are "app", "bundle", "pkg", or "mojit"
         * @param pkg {object} metadata (name and version) about the package
         * @param mojitType {string|null} name of mojit to which the resource belongs
         * @return {array} list of resources
         * @private
         */
        _findResourcesByConvention: function(dir, dirType, pkg, mojitType) {
            var me = this,
                ress = [];
            //console.log('-- FIND RESOURCES BY CONVENTION -- ' + pkg.name + '@' + pkg.version + ' -- ' + mojitType);

            this._walkDirRecursive(dir, function(error, subdir, file, isFile) {
                var source, ret, res;

                if ('node_modules' === file) {
                    return false;
                }
                if ('libs' === file) {
                    return false;
                }
                if ('tests' === file && 'test' !== me._appConfigStatic.env) {
                    return false;
                }

                source = {
                    fs: {
                        fullPath: libpath.join(dir, subdir, file),
                        rootDir: dir,
                        rootType: dirType,
                        subDir: subdir,
                        subDirArray: subdir.split('/'),
                        isFile: isFile,
                        ext: libpath.extname(file)
                    },
                    pkg: pkg
                };
                source.fs.basename = libpath.basename(file, source.fs.ext);

                if (me._skipBadPath(source.fs)) {
                    return false;
                }

                // TODO:  have fRBC() return mojitType and pass to parseResource()
                ret = me.findResourceByConvention(source, mojitType);
                if ('object' === typeof ret) {
                    if (ret.skipSubdirParts) {
                        source.fs.subDirArray = source.fs.subDirArray.slice(ret.skipSubdirParts);
                        source.fs.subDir = source.fs.subDirArray.join('/') || '.';
                    }
                    res = me.parseResource(source, ret.type, ret.subtype, mojitType);
                    if ('object' === typeof res) {
                        ress.push(res);
                    }
                    // don't recurse into resources that are directories
                    return false;
                }
                return ret;
            });

            return ress;
        },


        /**
         * Indicates whether file should be skipped based on its path
         *
         * @method _skipBadPath
         * @param pathParts {object} the "source.fs" part of the resource
         * @return {boolean} true indicates that the file should be skipped
         * @private
         */
        _skipBadPath: function(fs) {
            if (fs.isFile && fs.ext.substr(1).match(isNotAlphaNum)) {
                return true;
            }
            return false;
        },


        /**
         * A wrapper for fs.readdirSync() that guarantees ordering. The order in
         * which the file system is walked is significant within the resource
         * store, e.g., when looking up a matching context.
         *
         * @method _sortedReaddirSync
         * @param path {string} directory to read
         * @return {array} files in the directory
         * @private
         */
        _sortedReaddirSync: function(path) {
            var out = libfs.readdirSync(path);
            return out.sort();
        },


        /** 
         * Recursively walks a directory
         *
         * @method _walkDirRecursive
         * @param dir {string} directory to start at
         * @param cb {function(error, subdir, name, isFile)} callback called for each file
         * @param _subdir {string} INTERNAL argument, please ignore
         * @return {nothing} value returned via callback
         * @private
         */
        _walkDirRecursive: function(dir, cb, _subdir) {
            var subdir,
                fulldir,
                children,
                i,
                childName,
                childPath,
                childFullPath,
                childStat;

            subdir = _subdir || '.';
            fulldir = libpath.join(dir, subdir);
            if (!libpath.existsSync(fulldir)) {
                return;
            }

            children = this._sortedReaddirSync(fulldir);
            for (i = 0; i < children.length; i += 1) {
                childName = children[i];
                if ('.' === childName.substring(0, 1)) {
                    continue;
                }
                if ('node_modules' === childName) {
                    continue;
                }
                childPath = libpath.join(subdir, childName);
                childFullPath = libpath.join(dir, childPath);
                childStat = libfs.statSync(childFullPath);
                if (childStat.isFile()) {
                    cb(null, subdir, childName, true);
                } else if (childStat.isDirectory()) {
                    if (cb(null, subdir, childName, false)) {
                        this._walkDirRecursive(dir, cb, childPath);
                    }
                }
            }
        },


        /**
         * takes a list of globs and turns it into a list of matching paths
         * @param prefix {string} prefix for every path in the list
         * @param list {array} list of globs
         * @return {array} list of paths matching the globs
         * @private
         */
        _globList: function(prefix, list) {
            var found = [],
                i,
                glob;
            for (i = 0; i < list.length; i += 1) {
                glob = list[i];
                if ('/' !== glob.charAt(0)) {
                    glob = libpath.join(prefix, glob);
                }
                libglob.globSync(glob, {}, found);
            }
            return found;
        },


        // from http://stackoverflow.com/questions/171251/
        // how-can-i-merge-properties-of-two-javascript-objects-dynamically/
        // 383245#383245
        /**
         * Recursively merge one object onto another
         *
         * @method mergeRecursive
         * @param dest {object} object to merge into
         * @param src {object} object to merge onto "dest"
         * @param matchType {boolean} controls whether a non-object in the src is
         *          allowed to clobber a non-object in the dest (if a different type)
         * @return {object} the modified "dest" object is also returned directly
         */
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
        },


        /**
         * @method cloneObj
         * @param o {mixed}
         * @return {mixed} deep copy of argument
         */
        cloneObj: function(o) {
            var newO,
                i;

            if (typeof o !== 'object') {
                return o;
            }
            if (!o) {
                return o;
            }

            if ('[object Array]' === Object.prototype.toString.apply(o)) {
                newO = [];
                for (i = 0; i < o.length; i += 1) {
                    newO[i] = this.cloneObj(o[i]);
                }
                return newO;
            }

            newO = {};
            for (i in o) {
                if (o.hasOwnProperty(i)) {
                    newO[i] = this.cloneObj(o[i]);
                }
            }
            return newO;
        }


    });

    Y.namespace('mojito');
    Y.mojito.ResourceStore = ResourceStore;


}, '0.0.1', { requires: [
    'base',
    'oop',
    'addon-rs-config'
]});



YUI.add('addon-rs-config', function(Y, NAME) {

    var libfs = require('fs'),
        libpath = require('path'),
        libycb = require('./libs/ycb');

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
            this._ycbCache = {};    // fullPath: context: YCB config object
            this._ycbDims = this._readYcbDimensions();
        },


        // TODO:  needed to break cycle so we don't leak memory?
        destructor: function() {
            this.rs = null;
        },


        /**
         * Reads and parses a JSON file
         *
         * @method readConfigJSON
         * @param fullPath {string} path to JSON file
         * @return {mixed} contents of JSON file
         */
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
            return json;
        },


        /**
         * reads a configuration file that is in YCB format
         *
         * @method readConfigYCB
         * @param ctx {object} runtime context
         * @param fullPath {string} path to the YCB file
         * @return {object} the contextualized configuration
         */
        readConfigYCB: function(fullPath, ctx) {
            var cacheKey,
                json,
                ycb;

            ctx = this.rs.mergeRecursive(this.rs.getStaticContext(), ctx);

            //cache key only needs to account for dynamic context
            cacheKey = JSON.stringify(ctx);

            if (!this._ycbCache[fullPath]) {
                this._ycbCache[fullPath] = {};
            }

            ycb = this._ycbCache[fullPath][cacheKey];
            if (!ycb) {
                json = this.readConfigJSON(fullPath);
                json = this._ycbDims.concat(json);

                // libycb.read() will distructively modify its first argument
                ycb = libycb.read(this.rs.cloneObj(json), ctx);

                this._ycbCache[fullPath][cacheKey] = ycb;
            }
            return ycb;
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
                return false;
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




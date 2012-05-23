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

        mojitoRoot = __dirname;


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

            this.publish('preloadFile', { prefix:'rs', emitFacade:true });
            this.on('preloadFile', this.preloadFile, this);

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
                this._preloadDirMojits(libpath.join(dir, 'mojits'), pkg);
                break;
            case 'mojit':
                dir = libpath.join(info.dir, info.pkg.yahoo.mojito.location);
                this.preloadDirMojit(dir, pkg);
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
            var list,
                i;

            this._preloadDirBundle(this._config.root, pkg);

            // load mojitsDirs
            list = this._globList(this._config.root, this._appConfigStatic.mojitsDirs);
            for (i = 0; i < list.length; i += 1) {
                this._preloadDirMojits(list[i], pkg);
            }

            // load mojitDirs
            list = this._globList(this._config.root, this._appConfigStatic.mojitDirs || []);
            for (i = 0; i < list.length; i += 1) {
                this.preloadDirMojit(list[i], pkg);
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
            this._findResourcesByConvention(dir, pkg, 'shared');
        },


        /**
         * preloads a directory containing many mojits
         *
         * @method _preloadDirMojits
         * @param dir {string} directory path
         * @param pkg {object} metadata (name and version) about the package
         * @return {nothing} work down via other called methods
         * @private
         */
        _preloadDirMojits: function(dir, pkg) {
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
                this.preloadDirMojit(childPath, pkg);
            }
        },


        /**
         * preloads a directory that represents a single mojit
         *
         * @method preloadDirMojit
         * @param dir {string} directory path
         * @param pkg {object} metadata (name and version) about the package
         * @return {nothing} work down via other called methods
         * @private
         */
        preloadDirMojit: function(dir, pkg) {
            var i,
                realDirs,
                resources,
                res,
                mojitType,
                packageJson,
                definitionJson,
                appConfig,
                prefix,
                url;

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
                // TODO:  register mojit's package.json as a static asset (in "static handler" plugin?)
            }
            // TODO:  this._mojitPaths[mojitType] = dir;
            // replace with something more generic

            definitionJson = this.config.readConfigYCB(libpath.join(dir, 'definition.json'), {});
            if (definitionJson.appLevel) {
                mojitType = 'shared';
            }

            if ('shared' !== mojitType) {
                // TODO:  register definition.json as a dynamic URL
            }

            this._findResourcesByConvention(dir, pkg, mojitType);
        },


        preloadFile: function(evt) {
            var fs = evt.source.fs,
                baseParts = fs.basename.split('.'),
                res;

            // TODO:  test
            if (!fs.isFile && '.' === fs.typeDir && 'actions' === fs.basename) {
                return true;
            }
            if (!fs.isFile && 'actions' === fs.typeDirArray[0]) {
                return true;
            }
            if (fs.isFile && fs.typeDirArray.length >= 1 && 'actions' === fs.typeDirArray[0]) {
                if ('.js' !== fs.ext) {
                    return false;
                }
                res = {
                    source: evt.source,
                    mojit: evt.mojitType,
                    type: 'action',
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
                    Y.log('invalid action filename. skipping ' + fs.fullPath, 'warn', NAME);
                    return false;
                }
                fs.relativePath = libpath.join(fs.typeDirArray.slice(1).join('/'), fs.basename + fs.ext);
                res.name = libpath.join(fs.typeDirArray.slice(1).join('/'), baseParts.join('.'));
                res.id = [res.type, res.subtype, res.name].join('-');
                this.addResourceVersion(res);
                return false;
            }

            if (!fs.isFile && '.' === fs.typeDir && 'addons' === fs.basename) {
                return true;
            }
            if (!fs.isFile && 'addons' === fs.typeDirArray[0]) {
                return true;
            }
            if (fs.isFile && fs.typeDirArray.length >= 2 && 'addons' === fs.typeDirArray[0]) {
                if ('.js' !== fs.ext) {
                    return false;
                }
                res = {
                    source: evt.source,
                    mojit: evt.mojitType,
                    type: 'action',
                    subtype: fs.typeDirArray[1],
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
                    Y.log('invalid addon filename. skipping ' + fs.fullPath, 'warn', NAME);
                    return false;
                }
                fs.relativePath = libpath.join(fs.typeDirArray.slice(2).join('/'), fs.basename + fs.ext);
                res.name = libpath.join(fs.typeDirArray.slice(2).join('/'), baseParts.join('.'));
                res.id = [res.type, res.subtype, res.name].join('-');
                this.addResourceVersion(res);
                return false;
            }

            if (!fs.isFile && '.' === fs.typeDir && 'archetypes' === fs.basename) {
                return true;
            }
            if (!fs.isFile && fs.typeDirArray.length < 2 && 'archetypes' === fs.typeDirArray[0]) {
                return true;
            }
            if (!fs.isFile && fs.typeDirArray.length == 2 && 'archetypes' === fs.typeDirArray[0]) {
                res = {
                    source: evt.source,
                    mojit: null,
                    type: 'archetype',
                    subtype: fs.typeDirArray[1],
                    name: fs.basename,
                    affinity: 'common',
                    selector: '*'
                };
                fs.relativePath = fs.basename;
                res.id = [res.type, res.subtype, res.name].join('-');
                this.addResourceVersion(res);
                return false;
            }

            if (!fs.isFile && '.' === fs.typeDir && 'assets' === fs.basename) {
                return true;
            }
            if (!fs.isFile && 'assets' === fs.typeDirArray[0]) {
                return true;
            }
            if (fs.isFile && fs.typeDirArray.length >= 1 && 'assets' === fs.typeDirArray[0]) {
                res = {
                    source: evt.source,
                    mojit: evt.mojitType,
                    type: 'asset',
                    subtype: fs.ext.substr(1),
                    affinity: 'common',
                    selector: '*'
                };
                if (baseParts.length >= 2) {
                    res.selector = baseParts.pop();
                }
                if (baseParts.length !== 1) {
                    Y.log('invalid asset filename. skipping ' + fs.fullPath, 'warn', NAME);
                    return false;
                }
                fs.relativePath = libpath.join(fs.typeDirArray.slice(1).join('/'), fs.basename + fs.ext);
                res.name = libpath.join(fs.typeDirArray.slice(1).join('/'), baseParts.join('.'));
                res.id = [res.type, res.subtype, res.name].join('-');
                this.addResourceVersion(res);
                return false;
            }

            if (!fs.isFile && '.' === fs.typeDir && 'binders' === fs.basename) {
                return true;
            }
            if (!fs.isFile && 'binders' === fs.typeDirArray[0]) {
                return true;
            }
            if (fs.isFile && fs.typeDirArray.length >= 1 && 'binders' === fs.typeDirArray[0]) {
                if ('.js' !== fs.ext) {
                    return false;
                }
                res = {
                    source: evt.source,
                    mojit: evt.mojitType,
                    type: 'binder',
                    affinity: 'common',
                    selector: '*'
                };
                if (baseParts.length >= 2) {
                    res.selector = baseParts.pop();
                }
                if (baseParts.length !== 1) {
                    Y.log('invalid binder filename. skipping ' + fs.fullPath, 'warn', NAME);
                    return false;
                }
                fs.relativePath = libpath.join(fs.typeDirArray.slice(1).join('/'), fs.basename + fs.ext);
                res.name = libpath.join(fs.typeDirArray.slice(1).join('/'), baseParts.join('.'));
                res.id = [res.type, res.subtype, res.name].join('-');
                this.addResourceVersion(res);
                return false;
            }

            if (!fs.isFile && '.' === fs.typeDir && 'commands' === fs.basename) {
                return true;
            }
            if (!fs.isFile && 'commands' === fs.typeDirArray[0]) {
                return true;
            }
            if (fs.isFile && fs.typeDirArray.length >= 1 && 'commands' === fs.typeDirArray[0]) {
                if ('.js' !== fs.ext) {
                    return false;
                }
                res = {
                    source: evt.source,
                    mojit: null,
                    type: 'command',
                    affinity: 'common',
                    selector: '*'
                };
                if (baseParts.length !== 1) {
                    Y.log('invalid command filename. skipping ' + fs.fullPath, 'warn', NAME);
                    return false;
                }
                fs.relativePath = libpath.join(fs.typeDirArray.slice(1).join('/'), fs.basename + fs.ext);
                res.name = libpath.join(fs.typeDirArray.slice(1).join('/'), baseParts.join('.'));
                res.id = [res.type, res.subtype, res.name].join('-');
                this.addResourceVersion(res);
                return false;
            }

            if (fs.isFile && '.' === fs.typeDir && 'controller' === baseParts[0]) {
                if ('.js' !== fs.ext) {
                    return false;
                }
                res = {
                    source: evt.source,
                    mojit: evt.mojitType,
                    type: 'controller',
                    name: 'controller',
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
                    Y.log('invalid controller filename. skipping ' + fs.fullPath, 'warn', NAME);
                    return false;
                }
                fs.relativePath = libpath.join(fs.typeDirArray.slice(1).join('/'), fs.basename + fs.ext);
                res.id = [res.type, res.subtype, res.name].join('-');
                this.addResourceVersion(res);
                return false;
            }

            if (!fs.isFile && '.' === fs.typeDir && 'middleware' === fs.basename) {
                return true;
            }
            if (!fs.isFile && 'middleware' === fs.typeDirArray[0]) {
                return true;
            }
            if (fs.isFile && fs.typeDirArray.length >= 1 && 'middleware' === fs.typeDirArray[0]) {
                if ('.js' !== fs.ext) {
                    return false;
                }
                res = {
                    source: evt.source,
                    mojit: null,
                    type: 'middleware',
                    affinity: 'common',
                    selector: '*'
                };
                if (baseParts.length !== 1) {
                    Y.log('invalid middleware filename. skipping ' + fs.fullPath, 'warn', NAME);
                    return false;
                }
                fs.relativePath = libpath.join(fs.typeDirArray.slice(1).join('/'), fs.basename + fs.ext);
                res.name = libpath.join(fs.typeDirArray.slice(1).join('/'), baseParts.join('.'));
                res.id = [res.type, res.subtype, res.name].join('-');
                this.addResourceVersion(res);
                return false;
            }

            if (!fs.isFile && '.' === fs.typeDir && 'models' === fs.basename) {
                return true;
            }
            if (!fs.isFile && 'models' === fs.typeDirArray[0]) {
                return true;
            }
            if (fs.isFile && fs.typeDirArray.length >= 1 && 'models' === fs.typeDirArray[0]) {
                if ('.js' !== fs.ext) {
                    return false;
                }
                res = {
                    source: evt.source,
                    mojit: evt.mojitType,
                    type: 'model',
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
                    Y.log('invalid model filename. skipping ' + fs.fullPath, 'warn', NAME);
                    return false;
                }
                fs.relativePath = libpath.join(fs.typeDirArray.slice(1).join('/'), fs.basename + fs.ext);
                res.name = libpath.join(fs.typeDirArray.slice(1).join('/'), baseParts.join('.'));
                res.id = [res.type, res.subtype, res.name].join('-');
                this.addResourceVersion(res);
                return false;
            }

            // TODO:  spec, in "config" or "instance" plugin?

            if (!fs.isFile && '.' === fs.typeDir && 'views' === fs.basename) {
                return true;
            }
            if (!fs.isFile && 'views' === fs.typeDirArray[0]) {
                return true;
            }
            if (fs.isFile && fs.typeDirArray.length >= 1 && 'views' === fs.typeDirArray[0]) {
                res = {
                    source: evt.source,
                    mojit: evt.mojitType,
                    type: 'view',
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
                fs.relativePath = libpath.join(fs.typeDirArray.slice(1).join('/'), fs.basename + fs.ext);
                res.name = libpath.join(fs.typeDirArray.slice(1).join('/'), baseParts.join('.'));
                res.id = [res.type, res.subtype, res.name].join('-');
                this.addResourceVersion(res);
                return false;
            }

            // TODO:  yui-lang in the "yui" plugin

            // TODO:  yui-module in the "yui" plugin

//console.log('--TODO-- preloadFile ' + evt.mojitType + ' ' + libpath.join(fs.typeDir, fs.basename + fs.ext));
            return true;
        },


        addResourceVersion: function(res) {
//          console.log('---------------------------------------------- TODO addResourceVersion -- ' + res.mojit + ' ' + res.id);
//          console.log(res);
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
         * @param pkg {object} metadata (name and version) about the package
         * @param mojitType {string|null} name of mojit to which the resource belongs
         * @return {array} list of resources
         * @private
         */
        _findResourcesByConvention: function(dir, pkg, mojitType) {
            var me = this;
            //console.log('-- FIND RESOURCES BY CONVENTION -- ' + pkg.name + '@' + pkg.version + ' -- ' + mojitType);

            this._walkDirRecursive(dir, function(error, subdir, file, isFile) {
                var source;

                if ('node_modules' === file) {
                    return false;
                }
                if ('libs' === file) {
                    return false;
                }
                // TODO:  merge in fixes from master
                if ('tests' === file) {
                    return false;
                }
                // mojits are loaded another way later
                // TODO:  better test for what is a mojit dir (i.e., check against mojitDirs and mojitsDirs)
                if ('.' === subdir && 'mojits' === file) {
                    return false;
                }

                source = {
                    fs: {
                        fullPath: libpath.join(dir, subdir, file),
                        baseDir: dir,
                        typeDir: subdir,
                        typeDirArray: subdir.split('/'),
                        isFile: isFile,
                        ext: libpath.extname(file)
                    },
                    pkg: pkg
                };
                source.fs.basename = libpath.basename(file, source.fs.ext);

                if (me._skipBadPath(source.fs)) {
                    return false;
                }
                return me.fire('preloadFile', { source: source, mojitType: mojitType } );
            });
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
    'oop'
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
            this.rs.on('preloadFile', this.preloadFile, this);

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


        preloadFile: function(evt) {
            var fs = evt.source.fs,
                mojit = evt.mojitType,
                use = false,
                baseParts,
                res;

            // we only care about files
            if (!fs.isFile) {
                return true;
            }
            // we don't care about files in subdirectories
            if ('.' !== fs.typeDir) {
                return;
            }
            // we only care about json files
            if ('.json' !== fs.ext) {
                return;
            }
            // always use package.json
            if ('package' === fs.basename) {
                use = true;
            }
            // use all configs in the application
            if (0 === evt.source.pkg.depth) {
                use = true;
            }
            // use configs from non-shared mojits
            if (mojit && 'shared' !== mojit) {
                use = true;
            }
            if (!use) {
                return;
            }

            baseParts = fs.basename.split('.');
            res = {
                source: evt.source,
                mojit: mojit,
                type: 'config',
                affinity: 'common',
                selector: '*'
            };
            if (baseParts.length !== 1) {
                Y.log('invalid config filename. skipping ' + fs.fullPath, 'warn', NAME);
                return;
            }
            fs.relativePath = libpath.join(fs.typeDirArray.slice(1).join('/'), fs.basename + fs.ext);
            res.name = libpath.join(fs.typeDirArray.slice(1).join('/'), baseParts.join('.'));
            res.id = [res.type, res.subtype, res.name].join('-');
            this.rs.addResourceVersion(res);
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


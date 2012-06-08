==============
Resource Store
==============



.. Questions:

.. Need definition for the resource store

.. benefits?

.. What is the location for the metadata? Is it a JSON config file like application.json

.. metadata object: required, data types, defaults, examples

.. resource addon examples

.. Notes:

.. the new RS is uses the YUI Plugin mechanism to mix in the RS addons.  
.. http://yuilibrary.com/yui/docs/plugin/
.. redirect users to the yui docs on that topic
.. AOP: aspect-oriented programming or attribute oriented programming or something else?
.. allow the resource store to have addons
.. move most (all?) of the current resource store functionality into addons that ship with mojito
.. Examples of how to use the resource store


Intro
=====

The resource store is the Mojito framework code that managers and keeps track of the resources in your Mojito applications.
The resource store uses addons to do much of the work, which you can read about in `Resource Store Addons <>`_.
The code for the resource store is a `YUI Base <http://yuilibrary.com/yui/docs/base/>`_, which enables plugins to be implemented as `YUI Plugin modules <http://yuilibrary.com/yui/docs/plugin/>`_.
Being a YUI Base, the resource store also provides an event subsystem and a simple AOP substystem (methods ``beforeHostMethod`` and ``afterHostMethod``).



What is a Mojito Resource?
--------------------------

At the application level, resources include archetypes, commands, configuration files, and middleware. At the mojit level,
resources include controllers, models, binders, configuration files, and views. Developers can also create their own types of
resources.


What Does the Resource Store Do?
--------------------------------

#. Load the resources from disk and resolving versions if any exist.
#. Precalculate the YUI module dependencies of the resources.
#. Expanding the specs (??) into full instances.
#. Load and parse context configuration files.
#. Load the routes files.
#. Calculate static handler URLs.
#. Calculate rollups and inline CSS.

.. Don't think the following section is needed, but am leaving in doc for personal reference right now.

General Process of Resource Store
---------------------------------

Understanding the workflow of the resource store will give help those who want to customize addons to write code and
help others who don't plan on customizing addons to debug.

- walk resource versions, gathering mojit-specific resources into mojits
- precalculates ("resolves") which resource versions are used for each version of the mojit
- also keeps track of app-level resources (archetypes, commands, config files, and middleware).
- these are not versioned (no resolution needed)
- these are not otherwise grouped together
- provides methods for events, including those specialized for AOP
- host for addons
- explicitly uses these addons: selector, config
- is a YUI Base, in part to enable plugins to be implemented as YUI Plugin modules
   - also provides event subsystem
   - also provides simple AOP subsystem (beforeHostMethod() and afterHostMethod())

How Can Developers Use the Resource Store?
------------------------------------------

Developers can write addons for the resource store to have finer grain control over the management of resources
or extend the functionality of the resource store. The resource store has 

Allow developers to write resource store addons to do interesting things with resources


specifically, allow the application authors to write resource store addons to accomplish interesting things with resources

provide a mechanism so that addons can use AOP on the resource store (including addons)
provide a mechanism for other kinds of future-enabling extension points
allow custom (app-author provided) context-to-selector mapping
allow custom (app-author provided) resource types


To see the code for the resource store, see the `store.server.js <https://github.com/yahoo/mojito/blob/develop/source/lib/store.server.js>`_.

Resource Metadata
=================

Location
--------


Metadata Object
---------------

.. need better descriptions
.. default values
.. required
.. the table below is a rough approximation

+------------------------+---------------+-----------+---------------+-------------------------------------------+
| Property               | Data Type     | Required? | Default Value | Description                               |
+========================+===============+===========+===============+===========================================+
| ``affinity``           | string        | --        | --            | "server", "client", or "common"           | 
+------------------------+---------------+-----------+---------------+-------------------------------------------+
| ``fs``                 | string        | --        | none          | filesystem details                        |
+------------------------+---------------+-----------+---------------+-------------------------------------------+
| ``id``                 | string        | yes       | none          | unique ID.  common to all versions of the |
|                        |               |           |               | resource. (typically                      |
|                        |               |           |               | {type}-{subtype}-{name})                  | 
+------------------------+---------------+-----------+---------------+-------------------------------------------+
| `` mojit``             | string        | --        | none          | which mojit this applies to, if any       | 
|                        |               |           |               | ("shared" means the resource is available |
|                        |               |           |               | to all mojits)                            | 
+------------------------+---------------+-----------+---------------+-------------------------------------------+
| ``name``               | string        | yes       | none          | // name.  common to all versions of the   |
|                        |               |           |               | resource                                  | 
+------------------------+---------------+-----------+---------------+-------------------------------------------+
| `` pkg``               | string        | --        | none          | // packaging details                      | 
+------------------------+---------------+-----------+---------------+-------------------------------------------+
| `` source``            | string        | no        |               | When ``true``, the ``manifest``           |
|                        |               |           |               | attribute is added to ``<html>``.         |
+------------------------+---------------+-----------+---------------+-------------------------------------------+
| ``staticHandlerURL``   | string        | yes       | none          | // path used to load the resource         | 
|                        |               |           |               | onto the client                           |
+------------------------+---------------+-----------+---------------+-------------------------------------------+
| ``subtype``            | string        | no        | none          | // not all types have a subtype           | 
+------------------------+---------------+-----------+---------------+-------------------------------------------+
| ``type``               | string        | yes       | none          |                                           | 
+------------------------+---------------+-----------+---------------+-------------------------------------------+
| ``yui``                | string        | yes       | none          | // for resources that are YUI modules     | 
+------------------------+---------------+-----------+---------------+-------------------------------------------+



Example
-------

.. need a real example

.. code-block:: javascript

   {
     source:     // where the resource came from (not shipped to client)
     fs:     // filesystem details
     pkg:    // packaging details
     mojit:      // which mojit this applies to, if any ("shared" means the resource is available to all mojits)
     type:
     subtype:    // not all types have a subtype
     name:       // name.  common to all versions of the resource
     id:         // unique ID.  common to all versions of the resource. (typically {type}-{subtype}-{name})
     staticHandlerURL: // path used to load the resource onto the client
     yui:        // for resources that are YUI modules

     // these are only used in the metadata for each resource version.  the metadata
     // for resolved resources won't have these, since they're intrinsically part of
     // the resolved resource.
     affinity:   // "server", "client", or "common"
     selector:
   }


Built-In Resource Store Addons
==========================

Intro
-----

Mojito comes with built-in resource store addons that are used by the resource store
and the Mojito framework. These resource store addons are required by the resource store and 
the Mojito framework, so particular care must be taken when creating custom versions of them. 
This chapter takes a look at the built-in resource store addons, so you can better understand their use or 
customize your own versions. 


selector
````````

implements context-to-selector mapping
place where user implements their custom implementation
mojito ships with a default implementation, which the user can override

returns a priority-orders list of selectors (aka POSL)

Description
~~~~~~~~~~~

Requirements
~~~~~~~~~~~~
since this is used directly by the core, all implementations need to provide the following method:
getListFromContext(ctx)

Example
~~~~~~~

config
``````

Description
~~~~~~~~~~~

provides access to the contents of the configuration files
defines new mojit-specific resource type: config (for the mojit's definition.json and defaults.json)
defines new app-level resource type: config (for application.json, routes.json, dimensions.json, etc)
mojito ships with a default implementation. it's not expected that users will write their own

default implementation:
preloadFile() registers config files as type:config resources
listens for an event signifying the end of preload()
preloads the contents of the json files

Requirements
~~~~~~~~~~~~

since this is used directly by the core, all implementations need to provide the following methods:
readYCBDimensions(cb)
returns all the defined YCB dimensions
readResource(ctx, res, cb)
reads the config file pointed to by the resource

Example
~~~~~~~

.. code-block:: javascript

   
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





instance
````````

Description
~~~~~~~~~~~

provides access to mojit details
expands specs into full instances
defines new app-level resource type: spec (found in mojits/*/specs/*.json)
not used by resource store core, but critical to the mojito kernel

Requirements
~~~~~~~~~~~~

mojito ships with a default implementation. it's not expected that users will write their own
getMojitDetails(ctx, mojitType, cb)
returns a single structure that contains all details needed by the mojito kernel
this is made by aggregating information from all the resources in the mojit
expandSpec(ctx, spec, cb)
takes the spec and expands it into the full mojit instance data needed by the mojito kernel

Example
~~~~~~~


routes
``````

Description
~~~~~~~~~~~

provides access to the routes
not used by resource store core, but critical to the server-side mojito
mojito ships with a default implementation. it's not expected that users will write their own
provides a sugar method for reading all routes files, returning a single merged result


Requirements
~~~~~~~~~~~~

Example
~~~~~~~

YUI.add('addon-rs-routes', function(Y, NAME) {

    var libpath = require('path'),
        libycb = require(libpath.join(__dirname, '../../../libs/ycb'));

    function RSAddonRoutes() {
        RSAddonRoutes.superclass.constructor.apply(this, arguments);
    }
    RSAddonRoutes.NS = 'routes';
    RSAddonRoutes.DEPS = ['config'];
    RSAddonRoutes.ATTRS = {};

    Y.extend(RSAddonRoutes, Y.Plugin.Base, {

        initializer: function(config) {
            this.rs = config.host;
            this.appRoot = config.appRoot;
        },


        destructor: function() {
            // TODO:  needed to break cycle so we don't leak memory?
            this.rs = null;
        },


        read: function(env, ctx, cb) {
            ctx.runtime = env;
            var appConfig = this.rs.getAppConfig(ctx),
                routesFiles = appConfig.routesFiles,
                p,
                path,
                fixedPaths = {},
                out = {},
                ress,
                r,
                res,
                path,
                routes;

            for (p = 0; p < routesFiles.length; p += 1) {
                path = routesFiles[p];
                // relative paths are relative to the application
                if ('/' !== path.charAt(1)) {
                    path = libpath.join(this.appRoot, path);
                }
                fixedPaths[path] = true;
            }

            ress = this.rs.getResources(env, ctx, {type:'config'});
            for (r = 0; r < ress.length; r += 1) {
                res = ress[r];
                if (fixedPaths[res.source.fs.fullPath]) {
                    routes = this.rs.config.readConfigYCB(res.source.fs.fullPath, ctx);
                    out = Y.merge(out, routes);
                }
            }

            cb(null, out);
        }


    });
    Y.namespace('mojito.addons.rs');
    Y.mojito.addons.rs.routes = RSAddonRoutes;

}, '0.0.1', { requires: ['plugin', 'oop']});


staticHandler
`````````````

Description
~~~~~~~~~~~
calculates/manages the static handler URLs for resources
not used by resource store core, but used by the static handler middleware


Requirements
~~~~~~~~~~~~

before addResourceVersion()
for affinity:client resources, sets staticHandlerURL to the static handler URL for the resource
the URL might be a rollup URL
provides a method for the static handler middleware to find the filesystem path for a URL

Example
~~~~~~~


yui
```

Description
~~~~~~~~~~~

detects which resources are YUI modules, gathering additional metadata
defines new mojit-specific resource type: yui-module (found in autoload/ or yui_modules/)
defines new mojit-specific resource type: yui-lang (found in lang/)
precalculates YUI dependencies for mojit controllers and binders
mojito ships with a default implementation. it's not expected that users will write their own

Requirements
~~~~~~~~~~~~
after preloadFile()
if in autoload/ or yui_modules/ makes a type:yui-module resource
if in lang/ makes a type:yui-lang resource
before addResourceVersion()
if it's a resource implemented as a YUI module, gathers the YUI module metadata about it
after resolveMojit()
calculates the YUI module dependencies for the controller
calculates the YUI module dependencies for each binder

Example
~~~~~~~

.. code-block:: javascript

   /*
    * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
    * Copyrights licensed under the New BSD License.
    * See the accompanying LICENSE file for terms.
    */
   
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
                       logger.log('invalid YUI lang file format. skipping ' + fs.fullPath, 'error', NAME);
                   }
                   res.name = res.yui.lang;
                   res.id = [res.type, res.subtype, res.name].join('-');
                   return new Y.Do.Halt(null, res);
               }
   
               if ('yui-module' === type) {
                   baseParts = fs.basename.split('.'),
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


Creating Custom Addons
----------------------

General Process
```````````````

Requirements
````````````

Example
```````


shaker
~~~~~~

not part of mojito, given here as an example

tweaks the staticHandlerURL to something very sophisticated
can be on CDN
can be multi-mojit rollup
listen for staticHandlerURL resource field change
updates to sophisticated version







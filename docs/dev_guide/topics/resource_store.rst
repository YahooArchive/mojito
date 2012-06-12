==============
Resource Store
==============


.. General Questions:

.. 1. Need formal definition for the resource store and resource.

.. 2. What are the benefits of using the resource store?

.. 3. Should the title of this chapter be about what users can do with resource store? I'm not sure if developers
.. will even read this chapter because they won't necessarily know what the resource store is.

.. 4. Does AOP stand for aspect-oriented programming, attribute oriented programming, or something else?


.. _resource_store_intro:

Intro
=====

The resource store is the Mojito framework code that managers and keeps track of the resources in your Mojito applications.
The resource store uses addons to do much of the work, which you can read about in `Built-In Resource Store Addons <resource_store-builtin_addons>`_.
The code for the resource store is a `YUI Base <http://yuilibrary.com/yui/docs/base/>`_, which enables plugins to be implemented as `YUI Plugin modules <http://yuilibrary.com/yui/docs/plugin/>`_.
Being a YUI Base, the resource store also provides an event subsystem and a simple AOP subsystem (methods ``beforeHostMethod`` and ``afterHostMethod``).


.. _intro-what:

What is a Mojito Resource?
--------------------------

At the application level, resources include archetypes, commands, configuration files, and middleware. At the mojit level,
resources include controllers, models, binders, configuration files, and views. Developers can also create their own types of
resources. See `Types of Resources <metadata_obj-types_resources>`_ for descriptions of the resource types.


.. _intro-do:

How Does the Resource Store Work?
----------------------------------

.. Questions:

.. 1. What does 'host for addons' mean? (It's mentioned in the 'core' section of the twiki.)

Understanding the workflow of the resource store will give help those who want to customize addons to write code and
help others who don't plan on customizing addons to debug. 

In short, the resource store walks through the application-level, 
mojit-level, and npm module files (in that order) of a Mojito application, determines what type of resource each file is, 
creates an instance of the resource, and then registers the instance.

During this process, the resource store is also doing the following:

- precalculating ("resolving") which resource versions are used for each version of the mojit.
- keeping track of app-level resources (archetypes, commands, config files, and middleware).
- providing methods for events, including those specialized for AOP.
- explicitly using the addons `selector <intro-selector>`_ and `config <intro-config>`_


To see the code for the resource store, see `store.server.js <https://github.com/yahoo/mojito/blob/develop/source/lib/store.server.js>`_ in
the `Mojito GitHub repository <https://github.com/yahoo/mojito/>`_.


.. _intro-use:

How Can Developers Use the Resource Store?
------------------------------------------

.. Questions:

.. 1. Do we have any concrete or hypothesized examples of using AOP (still need to know what this is) on the resource store, creating resource
.. types, or mapping contexts to selectors? 
.. 2. Are there any other benefits for developers?

Developers can write addons for the resource store to have finer grain control over the management of resources
or extend the functionality of the resource store. As a developer, you can write custom addons to use AOP
on the resource store, create resource types, and map contexts to selectors.


.. _resource_store-metadata:

Resource Metadata
=================



.. Questions:

.. 1. 

.. _metadata-location:

Location
--------

.. What is the location for the metadata? Is it a JSON config file like application.json? If so, what is the file name?

.. _metadata-obj:

Metadata Object
---------------

.. Questions:

.. 0. Is the data type string for all of the properties?

.. 1. Please review and improve descriptions. The twiki and source code didn't offer much info for some.

.. 2. It would be nice to list default values, but if most properties don't have default values, then I could remove this column.

.. 3. Need to know what properties are required.

.. 4. The list of properties was taken from the twiki and the source code. I have added both sets of properties to the table,
.. by I imagine some do not belong.

.. 5. For ``configType``, what does it mean to specify a type of configuration? Do I need a section listing the types of configs w/ descriptions,
.. like the "Types of Resources" section below?

.. 6. Need a description for ``subtype`` and examples.

.. 7. What are the Mojito subsystems that addons can be added to? 

.. 8. Do we have a better description for ``name``? Any syntax convention, default values, or possible values?

.. 9. How do you specify metadata such as the dependencies (``require``) and languages with ``yuiModuleMeta``?




+------------------------+---------------+-----------+---------------+---------------------------+---------------------------------------------+
| Property               | Data Type     | Required? | Default Value | Possible Values           | Description                                 |
+========================+===============+===========+===============+===========================+=============================================+
| ``addonType``          | string        | --        | --            |                           | Specifies the mojito subsystem to which the |
|                        |               |           |               |                           | addon should be added and is required if    |
|                        |               |           |               |                           | type if ``type=addon``.                     |
+------------------------+---------------+-----------+---------------+---------------------------+---------------------------------------------+
| ``affinity``           | string        | --        | --            | ``server``, ``client``,   |                                             |
|                        |               |           |               | ``common``                |                                             |
+------------------------+---------------+-----------+---------------+---------------------------+---------------------------------------------+
| ``assetType``          | string        | --        | --            | ``css``, ``js``, ``png``, | Specifies the type of asset and is required |
|                        |               |           |               | ``png``, ``swf``          | if ``type=asset``.                          |
+------------------------+---------------+-----------+---------------+---------------------------+---------------------------------------------+
| ``configType``         | string        | --        | --            |                           | Specifies the type of configuration and is  |
|                        |               |           |               |                           | required if ``type=config``.                | 
+------------------------+---------------+-----------+---------------+---------------------------+---------------------------------------------+
| ``fsPath``             | string        | --        | none          |                           | The path on the filesystem to the resource. |                      
+------------------------+---------------+-----------+---------------+---------------------------+---------------------------------------------+
| ``id``                 | string        | yes       | none          |                           | A unique ID that is common to all versions  | 
|                        |               |           |               |                           | of the  resource. The ``id`` has the        |
|                        |               |           |               |                           | following syntax convention:                |
|                        |               |           |               |                           | ``{type}-{subtype}-{name}``                 | 
+------------------------+---------------+-----------+---------------+---------------------------+---------------------------------------------+
| `` mojit``             | string        | --        | none          |                           | which mojit this applies to, if any         | 
|                        |               |           |               |                           | ("shared" means the resource is available   |
|                        |               |           |               |                           | to all mojits)                              | 
+------------------------+---------------+-----------+---------------+---------------------------+---------------------------------------------+
| ``name``               | string        | yes       | none          |                           | // name.  common to all versions of the     |
|                        |               |           |               |                           | resource                                    | 
+------------------------+---------------+-----------+---------------+---------------------------+---------------------------------------------+
| `` pkg``               | string        | --        | none          |                           | // packaging details                        | 
+------------------------+---------------+-----------+---------------+---------------------------+---------------------------------------------+
| `` source``            | string        | no        |               |                           | where the resource came from                |
|                        |               |           |               |                           | (not shipped to client)                     |
+------------------------+---------------+-----------+---------------+---------------------------+---------------------------------------------+
| ``staticHandlerURL``   | string        | no        | none          |                           | The path used to load the resource          | 
|                        |               |           |               |                           | onto the client. Used only for resources    |
|                        |               |           |               |                           | that can be deployed by reference to the    |
|                        |               |           |               |                           | client.                                     |
+------------------------+---------------+-----------+---------------+---------------------------+---------------------------------------------+
| ``subtype``            | string        | no        | none          |                           | // not all types have a subtype             | 
+------------------------+---------------+-----------+---------------+---------------------------+---------------------------------------------+
| ``type``               | string        | yes       | none          | ``type=binder``           |                                             | 
+------------------------+---------------+-----------+---------------+---------------------------+---------------------------------------------+
| ``viewEngine``         | string        | no        | none          | ``mu``, ``dust``          | Specifies the view engine being used        |
|                        |               |           |               |                           | and is only used if ``type=view``.          | 
+------------------------+---------------+-----------+---------------+---------------------------+---------------------------------------------+
| ``viewOutputFormat``   | string        | no        | none          | ``xml``, ``html``         | Specifies the view engine being used        |
|                        |               |           |               |                           | and is only used if ``type=view``.          | 
+------------------------+---------------+-----------+---------------+---------------------------+---------------------------------------------+
| ``yui``                | string        | no        | none          |                           | // for resources that are YUI modules       | 
+------------------------+---------------+-----------+---------------+---------------------------+---------------------------------------------+
| ``yuiModuleMeta``      | string        | no        | none          |                           | Specifies the metadata, such dependencies,  |
|                        |               |           |               |                           | languages, etc., for a YUI 3 module.        |
+------------------------+---------------+-----------+---------------+---------------------------+---------------------------------------------+
| ``yuiModuleName``      | string        | no        | none          |                           | The name of any resource delivered as a     |
|                        |               |           |               |                           | YUI 3 module. The ``type`` must be          |
|                        |               |           |               |                           | ``yui-module``.                             |
+------------------------+---------------+-----------+---------------+---------------------------+---------------------------------------------+
| ``yuiModuleVersion``   | string        | no        | none          |                           | The version of any resource delivered as a  |
|                        |               |           |               |                           | YUI 3 module. The ``type`` must be          |
|                        |               |           |               |                           | ``yui-module``.                             |
+------------------------+---------------+-----------+---------------+---------------------------+---------------------------------------------+
| ``yuiSortedPaths``     | string        | no        | none          |                           | For any resource delivered as a YUI3 module,|
|                        |               |           |               |                           | this is the list of YUI modules required by |
|                        |               |           |               |                           | the module    with transitive dependencies  | 
|                        |               |           |               |                           | resolved. The ``type`` must be              | 
|                        |               |           |               |                           | ``yui-module``. 
+------------------------+---------------+-----------+---------------+---------------------------+---------------------------------------------+


.. _metadata_obj-types_resources:

Types of Resources
``````````````````

The ``type`` property of the metadata object can have any of the following values:

- ``config``      - a piece of configuration, sometimes for another resource
- ``controller``  - the controller for a mojit
- ``model``       - a model for a mojit
- ``view``        - a view for a mojit
- ``binder``      - a binder for a mojit
- ``action``      - an action to augment the controller
- ``asset``       - an asset (css, js, image, etc.)
- ``addon``       - an addon to the mojito system
- ``spec``        - the configuration for a mojit instance
- ``yui-lang``    - a YUI3 language bundle
- ``yui-module``  - a YUI3 module (that isn't one of the above)



.. _metadata-ex:

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

.. _resource_store-builtin_addons:

Built-In Resource Store Addons
==============================

.. Note: Replace code examples with links to Mojito source once the resource store addons have been merged into master.

.. _builtin_addons-intro:

Intro
-----

Mojito comes with built-in resource store addons that are used by the resource store
and the Mojito framework. These resource store addons are required by the resource store and 
the Mojito framework, so particular care must be taken when creating custom versions of them. 
This chapter takes a look at the built-in resource store addons, so you can better understand their use or 
customize your own versions. 

.. _intro-selector:

selector
````````

.. _selector-desc:

Description
~~~~~~~~~~~

The ``selector`` addon maps contexts to selectors and then returns
a priority-ordered list (POSL) of selectors. Developers can implement their custom implementation
to override the built-in ``selector`` addon.

.. _selector-reqs:

Requirements
~~~~~~~~~~~~

Because this is used directly by the the resource store, all implementations need to provide the following method:

``getListFromContext(ctx)``


getListFromContext(ctx)
~~~~~~~~~~~~~~~~~~~~~~~

.. Question: need description, spec, and example of ``ctx`` and return value.

**Parameters:** 

- ``ctx`` 

**Return:** 

.. _selector-ex:

Example
~~~~~~~

.. _intro-config:

config
``````

.. _config-desc:



.. Haven't decided whether to include this info:
.. default implementation:
.. preloadFile() registers config files as type:config resources
.. listens for an event signifying the end of preload()
.. preloads the contents of the json files



Description
~~~~~~~~~~~

The ``config`` addon provides access to the contents of the configuration files and
defines new mojit-level ``config`` resource types (for the mojit's ``definition.json`` and ``defaults.json``)
and new app-level ``config`` resource types (for ``application.json``, ``routes.json``, ``dimensions.json``, etc.).
Although developers can override the built-in ``config`` addon, it is not recommended.


.. _config-reqs:

Requirements
~~~~~~~~~~~~

Because this is used directly by the resource store, all implementations need to provide the following methods:

- ``readYCBDimensions(cb)``
- ``readResource(ctx, res, cb)``


.. _config-ex:

readYCBDimensions(cb)
~~~~~~~~~~~~~~~~~~~~~

.. Question: need description, spec, and example of ``cb`` and return value.

Returns all the defined dimensions.

**Parameters**

- ``cb`` 

**Return:** 

readResource(ctx, res, cb)
~~~~~~~~~~~~~~~~~~~~~~~~~~

.. Question: need description, spec, and example of ``ctx``, ``res``, ``cb`` and return value.

Reads the config file pointed to by the resource.

**Parameters**

- ``ctx``
- ``res``
- ``cb``

**Return:** 

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



.. _intro-instance:

instance
````````

.. _instance-desc:

Description
~~~~~~~~~~~

The ``instance`` addon provides access to mojit details, expands specs into full instances, and
defines new app-level ``spec`` resource types (found in ``mojits/*/specs/*.json``)
The ``instance`` addon is not used by the resource store, but is critical to the Mojito framework.

.. _instance-reqs:

Requirements
~~~~~~~~~~~~

Because this addon is critical to the Mojito framework, all implementations need to provide the following methods:

- ``getMojitDetails(ctx, mojitType, cb)``
- ``expandSpec(ctx, spec, cb)``

mojito ships with a default implementation. it's not expected that users will write their own

returns a single structure that contains all details needed by the mojito kernel
this is made by aggregating information from all the resources in the mojit

takes the spec and expands it into the full mojit instance data needed by the mojito kernel




.. _instance-ex:

Example
~~~~~~~

.. Need example

.. _intro-routes:

routes
``````
.. Questions:

.. 1. Is the sugar method ``getRoutes`` in ``store.server.js``?

.. 2. To write a custom ``routes`` addon, are developers required to override ``getRoutes`` with their own version of the function?



.. _routes-desc:

Description
~~~~~~~~~~~

The ``routes`` addon provides access to the routes. Athough the addon is
not used by resource store core, it is critical to the server-side Mojito
mojito ships with a default implementation. The resource store has a method
for returning all of the route files in a single merged result. Although
you can create a custom ``routes`` addon, we recommend using the built-in ``routes``
addon.


.. _routes-reqs:

Requirements
~~~~~~~~~~~~

.. _routes-ex:

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


.. _intro-staticHandler:

staticHandler
`````````````

.. _staticHandler-desc:

Description
~~~~~~~~~~~

The ``stackHandler`` addon calculates and manages the static handler URLs for resources.
The addon is not used by resource store core, but used by the static handler middleware.

.. _staticHandler-reqs:

Requirements
~~~~~~~~~~~~

before addResourceVersion()
for affinity:client resources, sets staticHandlerURL to the static handler URL for the resource
the URL might be a rollup URL
provides a method for the static handler middleware to find the filesystem path for a URL

.. _staticHandler-ex:

Example
~~~~~~~

.. _intro-yui:

yui
```

.. _yui-desc:

Description
~~~~~~~~~~~

detects which resources are YUI modules, gathering additional metadata
defines new mojit-specific resource type: yui-module (found in autoload/ or yui_modules/)
defines new mojit-specific resource type: yui-lang (found in lang/)
precalculates YUI dependencies for mojit controllers and binders
mojito ships with a default implementation. it's not expected that users will write their own

.. _yui-reqs:

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

.. _yui-ex:

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



Creating Custom Resource Store Addons
=====================================

Intro
-----

General Process
---------------

Requirements
------------

Example
-------


shaker
``````

not part of mojito, given here as an example

tweaks the staticHandlerURL to something very sophisticated
can be on CDN
can be multi-mojit rollup
listen for staticHandlerURL resource field change
updates to sophisticated version







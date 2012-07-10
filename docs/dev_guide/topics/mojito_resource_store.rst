==============
Resource Store
==============

.. |RS| replace:: Resource Store
.. |RSC| replace:: ResourceStore.server Class
.. _RSC: http://developer.yahoo.com/cocktails/mojito/api/classes/ResourceStore.server.html
.. |YUIPlugin| replace:: YUI Plugin
.. _|YUIPlugin| http://yuilibrary.com/yui/docs/plugin/

.. _rs-intro:

Intro
=====

The Resource Store (RS) is the Mojito subsystem that manages metadata about the files in your 
Mojito applications. The |RS| manages metadata about the files in the application. Thus, it is 
responsible for finding and classifying code and configuration files.


.. _intro-who:

Who Needs to Know About the Resource Store?
-------------------------------------------

Most Mojito application developers will not need to know much about the resource store, but 
advanced Mojito application developers who want to have finer grain control over the management 
of resources or extend the functionality of the resource store should read this documentation.

.. track new files types or modify information that the |RS| tracks through metadata can write 
.. their own |RS| addons.

.. _intro-use:

How Can the Resource Store Help Developers?
-------------------------------------------

You can write custom |RS| addons to use the aspect-oriented features of
the resource store, to create resource types, and to map contexts to selectors.

For example, you could write your own |RS| addon so that the Mojito command-line
tool will create files and resources for your application. The Mojito command-line
tool uses the |RS| for all the commands except ``start``. 

You can also write custom versions of built-in |RS| addons to modify how the resource store works. 
You custom addon could track new file types, augment the information that |RS| stores about files or 
code, or augment/replace the information returned by the |RS|.            
         

.. _rs-resources:

Resources
=========

.. _resources-what:

What is a Resource?
-------------------

.. _what-to_mojito:

To Mojito
`````````

The Mojito framework primarily views a **resource** as something useful found on the filesystem.

.. _what-to_rs:

To the Resource Store
`````````````````````

The |RS| primarily cares about the *metadata* about each resource
The |RS| uses metadata resources, so it calls the 
metadata the "resource".  The "resource" is just a JavaScript object containing 
metadata.  The |RS| define certain keys with specific meanings.  |RS| addons 
can add, remove, or modify those keys/values as they see fit.  (For 
example, it is the yui |RS| addon that adds the ``yui`` key with metadata 
about resources that are YUI modules.  The |RS| itself doesn't populate 
the ``yui`` key of each resource.)   


.. _resources-versions:

Resource Versions
-----------------

Because there can be multiple files which are all conceptually different versions of the
same thing (think ``views/index.mu.html`` and ``views/index.iphone.mu.html``), the |RS| defines
"resource version" as the metadata about each file and "resource" as the metadata
about the file chosen among the possible choices.

The process of choosing which version of a resource to use is called *resolution* (or
"resolving the resource").  This act is one of the primary responsibilities of the |RS|.

See "resolution and priorities" below.

.. _resources-scope:

Resource Scope
--------------

.. _scope-application:

Application-Level Resources
```````````````````````````

Application-level resources are truly global to the application.
Some example resource types are middleware, |RS| addons, archetypes, and commands.
(As an implementation detail, the |RS| still tracks resource versions for these kinds of resources
and then resolves those versions down to a chosen resource, even though there's only one version
of each resource.  More work at server start, but less code to write and debug.)
At the application level, resources include archetypes, commands, configuration files, and 
middleware. 

.. _scope-mojit:

Mojit-Level Resources
`````````````````````

At the mojit level, resources include controllers, models, binders, configuration files, and views. 
These resources are limited in scope to a mojit.

.. _scope-shared:

Shared Resources
````````````````

Some resources (and resource versions) are *shared*, meaning that they are included in **all**
mojits.  Most resource types that are mojit level can also be shared.  Examples of mojit-level
resource types that can't be shared are controllers, configuration files (such as 
``definition.json``), and YUI language bundles.

.. _resources-types:

Resource Types
--------------

The resource type is defined by the ``type`` property in the metadata for a given resource.
See `Types of Resources <metadata_obj-types_resources>`_ for descriptions of the built-in resource 
types. Developers can also create their own types of resources to fit the need of their 
applications. 



.. _rs-metadata:

Resource Metadata
=================

.. _metadata-intro:

Intro
-----

The resource store uses metadata to find, load, parse, and create instances of resources. The 
resource metadata is generated by code--it has no representation on the filesystem.  It is 
generate during ``preload``, either by the |RS| itself or by |RS| addons.   


.. _metadata-obj:

Metadata Object
---------------

Some values do have defaults, but it depends on the value of the ``type`` 
key, and/or comes from the file name of the resource being represented. 
For example, the affinity of views is ``common`` (because views are used 
on both client and server); however, the affinity for controllers comes 
from the file name.        

+------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
| Property               | Data Type     | Required? | Default Value | Possible Values             | Description                                 |
+========================+===============+===========+===============+=============================+=============================================+
| ``affinity``           | string        | --        | --            | ``server``, ``client``,     | The affinity of the resource, which         |
|                        |               |           |               | ``common``                  | indicates where the resource will be used.  |
+------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
| ``id``                 | string        | yes       | none          | N/A                         | A unique ID that is common to all versions  | 
|                        |               |           |               |                             | of the  resource. The ``id`` has the        |
|                        |               |           |               |                             | following syntax convention:                |
|                        |               |           |               |                             | ``{type}-{subtype}-{name}``                 | 
+------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
| `` mojit``             | string        | no        | none          | ``shared``                  | The mojit, if any, that uses this resource  | 
|                        |               |           |               |                             | The value ``"shared"`` means the resource   |
|                        |               |           |               |                             | is available to all mojits.                 | 
+------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
| ``name``               | string        | yes       | none          |                             | The name of the resource that is common to  |
|                        |               |           |               |                             | all versions (i.e., iPhone/Android, etc.)   | 
|                        |               |           |               |                             | of the resource. Example: the name for      |
|                        |               |           |               |                             | for the resources ``index.iphone.mu.html``  |
|                        |               |           |               |                             | and ``index.mu.html`` is ``index``.         |
+------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
| ``selector``           | string        | no        | "*"           |                             | The version of the resource, not to be      |
|                        |               |           |               |                             | confused revisions that mark the change of  |
|                        |               |           |               |                             | the resource over time. For example, a      |
|                        |               |           |               |                             | resource could have a version for iPhones,  |
|                        |               |           |               |                             | Android devices, fallbacks, etc.            |
+------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
| ``source``             | object        | yes       |               |                             | Specifies where the resource came from      |
|                        |               |           |               |                             | (not shipped to client). See `source Object |
|                        |               |           |               |                             | <src_obj>`_ for details.                    |
+------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
| ``subtype``            | string        | no        | none          | ``action``, ``binder``,     | Some resource types have multiple subtypes  |
|                        |               |           |               | ``command``, ``middleware`` | that can be specified with ``subtype``. See |
|                        |               |           |               | ``model``, ``view``         | `Subtypes <subtypes_resources>`_ for more   |
|                        |               |           |               |                             | information.                                |   
+------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
| ``type``               | string        | yes       | none          | See `Types of Resources <ty |                                             | 
|                        |               |           |               | pes_resources>`_.           |                                             |
+------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
| ``url``                | string        | no        | none          |                             | The path used to load the resource          | 
|                        |               |           |               |                             | onto the client. Used only for resources    |
|                        |               |           |               |                             | that can be deployed by reference to the    |
|                        |               |           |               |                             | client.                                     |
+------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
| ``yui``                | object        | no        | none          |                             | // for resources that are YUI modules ==??  | 
+------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+

.. _src_obj:

source Object
`````````````

+------------------------+---------------+-----------+---------------+-------------------------------+---------------------------------------------+
| Property               | Data Type     | Required? | Default Value | Possible Values               | Description                                 |
+========================+===============+===========+===============+===============================+=============================================+
| ``fs``                 | string        | yes       | none          | N/A                           | // filesystem details ==> ??                |
+------------------------+---------------+-----------+---------------+-------------------------------+---------------------------------------------+
| ``pkg``                | array         | yes       | none          | N/A                           | // packaging details ==> what details?      |
+------------------------+---------------+-----------+---------------+-------------------------------+---------------------------------------------+

.. _yui_obj:

yui Object
``````````

The ``yui`` property of the metadata object is created by the ``yui`` resource store addon, and 
therefore, the ``yui`` property can be any data type. In general, the ``yui`` property is an object 
containing metadata about YUI modules. The following table liststhe typical properties that are 
part of the ``yui`` object. You can think of the ``yui`` object as a container for the arguments to 
the ``YUI.add`` method that is used to register reusable YUI modules.

+------------------------+---------------+-----------+---------------+-------------------------------+---------------------------------------------+
| Property               | Data Type     | Required? | Default Value | Possible Values               | Description                                 |
+========================+===============+===========+===============+===============================+=============================================+
| ``name``               | string        | yes       | none          | "scroll"                      | The name of the YUI module.                 |
+------------------------+---------------+-----------+---------------+-------------------------------+---------------------------------------------+
| ``meta.requires``      | array         | yes       | none          | ``["scroll","node","cache"]`` | Contains a list of YUI modules required by  |
|                        |               |           |               |                               | this resource.                              |
+------------------------+---------------+-----------+---------------+-------------------------------+---------------------------------------------+


.. _metadata-types:

Types of Resources
------------------

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

.. _types-subtypes:

Subtypes
````````

You can use a subtype to specify types of a ``type``. For example, a 
resource of ``type:addon`` might have subtypes, such as ``subtype:ac`` for AC addons,  
``subtype:view-engine`` for view engines, or ``subtype:rs`` for |RS| addons. 

For "type:archetype" the subtypes refers to the "type" described by 
`mojito help create`.  So, you could have "subtype:app" or 
"subtype:mojit".  (There might be more in the future!)       


.. _metadata-ex:

Example
-------


.. code-block:: javascript

   {
     "source": {
       "fs": {
         "fullPath": "/Users/folta/work/yahoo/mojito/github-drewfish/examples/getting-started-guide/part4/paged-yql/mojits/PagedFlickr/views/index.mu.html",
         "rootDir": "/Users/folta/work/yahoo/mojito/github-drewfish/examples/getting-started-guide/part4/paged-yql/mojits/PagedFlickr",
         "rootType": "mojit",
         "subDir": ".",
         "subDirArray": [],
         "isFile": true,
         "ext": ".html",
         "basename": "index.mu"
       },
       "pkg": {
         "name": "paged-yql",
         "version": "0.1.0",
         "depth": 0
       }
     },
     "type": "view",
     "name": "index",
     "id": "view--index",
     "mojit": "PagedFlickr",
     "affinity": "common",
     "selector": "iphone",
     "viewOutputFormat": "html",
     "viewEngine": "mu",
     "url": "/static/PagedFlickr/views/index.mu.html"
   } 
   


.. Note: Drew is thinking of change "viewOutputFormat" and "viewEngine" to go under a "view" 
.. sub-object.  I'll let you know if I make that change.    

.. _rs-how:

How Does the Resource Store Work?
=================================

Understanding the workflow of the resource store will give help those who want to customize addons 
to write code and help others who don't plan on customizing addons to debug. 

In short, the resource store walks through the application-level, 
mojit-level, and ``npm`` module files (in that order) of a Mojito application, determines what type 
of resource each file is, creates metadata about the resource, and then registers the resource.

During this process, the resource store is also doing the following:

- pre-calculating ("resolving") which resource versions are used for each version of the mojit.
- keeping track of app-level resources (archetypes, commands, config files, and middleware).
- providing methods for events, including those specialized for AOP.
- explicitly using the addons `selector <intro-selector>`_ and `config <intro-config>`_

To see the code for the resource store, see `store.server.js <https://github.com/yahoo/mojito/blob/develop/source/lib/store.server.js>`_.

.. _how-walk_fs:

Walking the Filesystem
----------------------

Resource versions are discovered by the |RS| at server-start time.  (Mojito server calls the
``preload`` method of the |RS|.)

This is done by walking all the files in the application, excluding the ``node_modules`` directory.

Then, all files in the packages in `node_modules` are walked.  The packages are walked in
breadth-first fashion, so that *shallower* packages have precedence above *deeper* ones.
(Not all the packages are used, of course, only those that have declared themselves as extensions
to Mojito.)

(Then, if Mojito wasn't found in ``node_modules``, the globally-installed version of Mojito is 
walked.)

After all that, the |RS| knows about all the resource versions.  Then it resolves those versions
into the resources as described below.  That still happens as part of ``preload``.

.. _how-resolution:

Resolution and Priorities
-------------------------

The act of resolving the resource versions is really just resolving the affinities and selectors.

For example, the application might have the following:

- ``controller.common.js``
- ``controller.common.iphone.js``
- ``controller.server.js``
- ``controller.server.phone.js``

The order of the selectors is defined by a **priority-ordered selector list (POSL)**.  The POSL 
depends on the runtime context.  In our example, the POSL for context ``{device:browser}`` might 
be ``['*']`` but for context ``{device:iphone}`` might be ``['iphone','*']``.

(We need to use a (prioritized) list of selectors instead of just a "selector that matches the 
context" because not all versions might exist for all selectors.  In the example above, if
``controller.server.iphone.js`` didn't exist we should still do the right thing for context 
``{device:iphone}``.)

The choice depends on the **affinity** as well.  If we're resolving versions for the server, 
versions with ``affinity:server`` will have higher priority than ``affinity:common``, and 
``affinity:client`` will be completely ignored.

The final consideration for priority is the **source**.  Mojit-level versions have higher priority 
than shared versions.  For example, imagine an application with the following:

- ``mojits/Foo/models/bar.common.js``
- ``models/bar.common.js``

In this case, the second resource is shared with all mojits.  However, the mojit ``Foo`` has 
defined its own version of the same resource (``id: model--bar``), and so that should have higher 
priority than the shared one.

Finally, there's a **relationship** between the different types of priority.

#. The source has the highest priority.
#. The selector has the next highest priority.
#. The affinity has the least highest priority.

That means that if there exists, for example, both a ``controller.server.js`` and 
``controller.common.iphone.js``, for the server and context ``{device:iphone}``, the second version 
will be used because its selector is a higher priority match than its affinity.


All this is pre-calculated for each resource, for each possible runtime configuration (client or 
server, and
every possible runtime context).

.. _how-get_data:

Getting Data from the Resource Store
------------------------------------

Besides the standard ways that Mojito uses the resource store, there are generic interfaces for 
getting resources and resource versions from the |RS|.

- ``getResourceVersions(filter)``
- ``getResources(env, ctx, filter)``

The APIs are intentionally similar.  Both return an array of resources, and the ``filter`` argument
can be used to restrict the returned resources (or versions).  It is an object, all of whose
keys and values must match the returned resources (or versions).  Think of it as a *template*
or *partial resource* that all resources must match. For example, a filter of ``{type:'view'}``
will return all the views.

For mojit-level resources or resource versions, specify the mojit name in the filter.  For example,
filter ``{mojit:'Foo'}`` will return all resources (or versions) in the ``Foo`` mojit.

.. note:: Because of the resolution process, the resources returned for filter ``{mojit:'Foo'}``
might contain shared resources.

To get mojit-level resources (or versions) from multiple mojits, you'll have to call
the method ``getResourceVersions` or ``getResources`` for each mojit.  You can call 
``listAllMojits`` to get the list of all mojits.



.. _resource_store-addons:

Resource Store Built-In Addons
==============================

Intro
-----

Mojito comes with built-in resource store addons that are used by the resource store
and the Mojito framework. These resource store addons are required by the |RS| and 
the Mojito framework. Thus, particular care must be taken when creating custom versions 
of them. 

The |RS| comes with the following four built-in addons:  

- ``config``
   - registers new resource type ``config`` found in ``.json`` files
   - provides API for reading both context and straight-JSON files
   - provides sugar for reading the application's dimensions
- ``selector``
   - decides the priority-ordered list (POSL) to use for a context
   - looks (default implementation) for ``selector`` in ``application.json``. Because 
     ``application.json`` is a context configuration file, the ``selector`` can be contextualized 
     there.
- ``url``
   - calculates the static handler URL for appropriate resources (and resource versions)
   - stores the URL in the ``url`` key of the resource
   - calculates the asset URL base for each mojit
- ``yui``
   - registers new resource type ``yui-module`` found in ``autoload`` or ``yui_modules``
   - registers new resource type ``yui-lang`` found in ``lang``
   - calculates the ``yui`` metadata for resource versions which are YUI modules
   - pre-calculates corresponding YUI module dependencies when resources are resolved
     for each version of each mojit, 
   - appends the pre-calculated YUI module dependencies for the controller and binders when 
     Mojito queries the |RS| for details of a mojit (``getMojitTypeDetails`` method) 
   - provides methods used by Mojito to configure its YUI instances
  

.. _resource_store-custom_addons:

Creating Custom Versions of Built-In |RS| Addons
----------------------------------------------

We will be examining the ``selector`` and ``url`` addons to help you create custom versions of 
those addons. We do not recommend that you create custom versions of the 
``config`` or ``yui`` addons, so we will not be looking at those addons. Also, this documentation 
explains what the |RS| expects the addon to do, so you can create your own version of the addons. 
To learn what a |RS| addon does, please refer to the |RSC|_ in the API documentation.


.. _intro-selector:

selector
````````

.. _selector-desc:

Description
~~~~~~~~~~~

If you wish to use a different algorithm for to determine the selectors to use,
you can implement your own version of this |RS| addon.  It'll need to go in
``addons/rs/selector.server.js`` in your application.  


.. _selector-reqs:

Requirements
~~~~~~~~~~~~

Because the ``selector`` addon is used directly by the the resource store, all implementations need to provide the following method:

- ``getListFromContext(ctx)``

.. _selector-getListFromContext:

getListFromContext(ctx)
~~~~~~~~~~~~~~~~~~~~~~~
Returns the priority-ordered selector list (POSL) for the context.

**Parameters:** 

- ``ctx <String>`` - The context that the application is running in. 

**Return:** 

``<Array>``

.. _selector-ex:

Example
~~~~~~~

.. _url-intro:

url
```

.. _url-desc:

Description
~~~~~~~~~~~


The ``url`` addon calculates and manages the static handler URLs for resources.
The addon is not used by resource store core, but used by the static handler middleware.

If you wish to use a different algorithm to determine the URLs, you can
implement your own version of this |RS| addon.  It'll need to go in
``addons/rs/url.server.js`` in your application.

After the method ``preloadResourceVersions`` sets ``res.url`` to the static handler URL
for the resource, the method ``getMojitTypeDetails`` sets the mojit's ``assetsRoot``. 
The static handler URL can be a rollup URL.

The ``url`` addon also provides a method for the static handler middleware to find the 
filesystem path for a URL.


.. _url-reqs:

Requirements
~~~~~~~~~~~~

The ``selector`` addon is required to have the following methods (see details for the methods in 
below sections):

- ``getPathForURL(url)``
- ``getSpecURL(id)``
- ``getURLPaths()``
- 

Your addon will also be required to do the following:

- Add the ``url`` metadatum to resource versions; this is where your addon will set the calculated 
  value (using ``beforeHostMethod('addResourceVersion')``).
- Add ``assetsRoot`` to the results of ``getMojitTypeDetails()``, which is done with 
  ``onHostEvent('getMojitTypeDetails')``; ``assetsRoot`` is the common prefix for all assets in the 
  mojit. The built-in addon makes something like ``/static/Foo/assets`` for the ``Foo`` mojit.

.. _url-getPathForURL:

getPathForURL(url)
``````````````````
This method is called by the static handler middleware. Returns the full filesystem path for the 
URL.

**Parameters:** 

- ``url <String>`` - The URL that was previously generated.

**Return:** 

``<String>`` 

.. _url-getSpecURL:

getSpecURL(id)
``````````````
Returns the URL for the spec.

**Parameters:** 

- ``id <String>`` - the spec ID.

**Return:** 

``<String>`` 

.. _url-getSpecURL:

getURLPaths()
`````````````
Returns an object whose keys are all URLs and whose values are the corresponding filesystem paths.

**Parameters:** 

None.

**Return:** 

``<Object>`` 



.. _url-ex:

Example
~~~~~~~


Creating Your Own Resource Store Addons
=======================================

Intro
-----

In this section, we will discuss the key methods, events, and give a simple example of a custom 
|RS| addon. You should be able to create your own custom |RS| addons afterward.

Anatomy of a |RS| Addon
---------------------

The resource store addons are implemented using the _|YUIPlugin| mechanism. In essence, a Mojito 
addon is a YUI plugin, so the skeleton of a |RS| addon will be the same as a YUI Plugin. 

Key Methods
~~~~~~~~~~~

initialize(config)
``````````````````

**Parameters:**

- ``config <Object>`` - contains the following: 
- ``host <Object>`` - contains the resource store.
- ``appRoot <String>`` - the directory of the application.
- ``mojitoRoot <String>`` - the directory of the Mojito framework code.
      
**Return:**

None.

preload()
`````````

- Addons are loaded during this method, so it's not possible to hook in before ``preload`` is 
  called.
- During preload, the methods ``preloadResourceVersions`` and ``resolveResourceVersions`` are 
  called.
- After ``preload`` has been called, you can hook in with ``afterHostMethod('preload', ...)``.

**Parameters:**

**Return:**

preloadResourceVersions()
`````````````````````````
- The |RS| walks the filesystem in this method.
- Before ``preloadResourceVersions`` is called, not much is known, though the static application configuration is available using the method ``getStaticAppConfig``.
- Within the ``preloadResourceVersions`` method, the following host methods are called:  ``findResourceVersionByConvention``, ``parseResourceVersion``, and ``addResourceVersion``
- After ``preloadResourceVersions`` has been called:
   - All the resource versions have been loaded and are available through the method ``getResourceVersions``.
   - The |RS| has ``selectors`` object whose keys are all selectors in the application.  The values for the keys are just ``true``.


**Parameters:**

**Return:**

findResourceVersionByConvention()
`````````````````````````````````

    * called on each directory or file being walked
    * used to decide if the path is a resource version
    * return value is a bit tricky, so read API docs carefully (and ask questions if not clear)
    * typically, hook into this via `afterHostMethod()` to register your own resource version types
    * this should work together with your own version of `parseResourceVersion()`

**Parameters:**

**Return:**

parseResourceVersion()
``````````````````````

    * called to create an actual resource version
    * typically, hook into this via `beforeHostMethod()` to create your own resource versions
    * this should work together with your own version of `findResourceVersionByConvention()`

**Parameters:**

**Return:**
    
addResourceVersion()
````````````````````

   * called to save the resource version into the |RS|
   * typically, if you want to modify/augment an existing resource version, hook into this via `beforeHostMethod()`

**Parameters:**

**Return:**


resolveResourceVersions()
`````````````````````````

    * called to resolve the resource versions down into resources
    * during this, the `mojitResourcesResolved` event is called
    * after this, all resource versions have been resolved
    
**Parameters:**

**Return:**

serializeClientStore()
``````````````````````

called during runtime as Mojito creates the configuration for the client-side Mojito

**Parameters:**

**Return:**
        

Key Events
~~~~~~~~~~

mojitResourcesResolved
``````````````````````
Called when the resources in a mojit are resolved.

getMojitTypeDetails
```````````````````
Called during runtime as Mojito creates an "instance" used to dispatch a mojit.


Example
-------

|RS| Addon
````````

The following |RS| addon registers the new resource type ``text`` for text files.

``addons/rs/text.server.js``

.. code-block:: javascript


YUI.add('addon-rs-text', function(Y, NAME) {

    var libpath = require('path');


    function |RS|AddonText() {
        |RS|AddonText.superclass.constructor.apply(this, arguments);
    }
    |RS|AddonText.NS = 'text';
    |RS|AddonText.ATT|RS| = {};

    Y.extend(|RS|AddonText, Y.Plugin.Base, {

        initializer: function(config) {
            this.rs = config.host;
            this.appRoot = config.appRoot;
            this.mojitoRoot = config.mojitoRoot;
            this.afterHostMethod('findResourceVersionByConvention', this.findResourceVersionByConvention, this);
            this.beforeHostMethod('parseResourceVersion', this.parseResourceVersion, this);
        },


        destructor: function() {
            // TODO:  needed to break cycle so we don't leak memory?
            this.rs = null;
        },


        /**
        * Using AOP, this is called after the ResourceStore's version.
        * @method findResourceVersionByConvention
        * @param source {object} metadata about where the resource is located
        * @param mojitType {string} name of mojit to which the resource likely belongs
        * @return {object||null} for config file resources, returns metadata signifying that
        */
        findResourceVersionByConvention: function(source, mojitType) {
          // we only care about files
          if (!source.fs.isFile) {
                return;
          }

          // we only care about txt files
          if ('.txt' !== source.fs.ext) {
            return;
          }

          return new Y.Do.AlterReturn(null, {
                type: 'text'
          });
        },


        /**
        * Using AOP, this is called before the ResourceStore's version.
        * @method parseResourceVersion
        * @param source {object} metadata about where the resource is located
        * @param type {string} type of the resource
        * @param subtype {string} subtype of the resource
        * @param mojitType {string} name of mojit to which the resource likely belongs
        * @return {object||null} for config file resources, returns the resource metadata
        */
       parseResourceVersion: function(source, type, subtype, mojitType) {
            var res;

         if ('text' !== type) {
           return;
         }

         res = {
           source: source,
           type: 'text',
           affinity: 'server',
           selector: '*'
         };
         if ('app' !== source.fs.rootType) {
           res.mojit = mojitType;
         }
         res.name = libpath.join(source.fs.subDir, source.fs.basename);
         res.id = [res.type, res.subtype, res.name].join('-');
         return new Y.Do.Halt(null, res);
       }
     });
     Y.namespace('mojito.addons.rs');
     Y.mojito.addons.rs.text = |RS|AddonText;

   }, '0.0.1', { requires: ['plugin', 'oop']});


Text Addon
``````````

The Text Addon provides accessors so that that controller can access resources of type ``text``.

``addons/ac/text.server.js``

.. code-block:: javascript


   YUI.add('addon-ac-text', function(Y, NAME) {

     var libfs = require('fs');

     function Addon(command, adapter, ac) {
       this._ctx = ac.command.context;
     }
     Addon.prototype = {
     
       namespace: 'text',

       setStore: function(store) {
         this._store = store;
       },
       list: function() {
         var r, res, ress, list = [];
         ress = this._store.store.getResources('server', this._ctx, {type:'text'});
         for (r = 0; r < ress.length; r += 1) {
           res = ress[r];
           list.push(res.name);
         }
         return list;
       },
       read: function(name, cb) {
         var ress;
         ress = this._store.store.getResources('server', this._ctx, {type:'text', name:name});
         if (!ress || 1 !== ress.length) {
           cb(new Error('Unknown text file ' + name));
         }
         libfs.readFile(ress[0].source.fs.fullPath, 'utf-8', function(err, body) {
           cb(err, body);
         });
       }
     };
     Y.mojito.addons.ac.text = Addon;
     }, '0.1.0', {requires: ['mojito']}
   );

Controller
``````````

``mojits/Viewer/controller.server.js``


.. code-block:: javascript

   YUI.add('Viewer', function(Y, NAME) {
   
     Y.mojito.controllers[NAME] = {

       init: function(config) {
         this.config = config;
       },

       index: function(ac) {
         var chosen; // TODO:  use form input to choose a text file
         if (!chosen) {
           var list;
           list = ac.text.list();
           chosen = list[0];
         }
         ac.assets.addCss('./index.css');
         ac.text.read(chosen, function(err, body) {
           if (err) {
             return ac.error(err);
           }
           ac.done({body: body});
         });
       }
     };
   }, '1.0.1', {requires: ['mojito', 'addon-ac-text']});
==============
Resource Store
==============



.. Questions:

.. Need definition for the resource store

.. benefits?

.. What is the location for the metadata? Is it a JSON config file like application.json

.. metadata object: required, data types, defaults, examples

.. resource addon examples


Intro
=====

allow the resource store to have addons
move most (all?) of the current resource store functionality into addons that ship with mojito

What is a Mojito Resource?
--------------------------

Purpose
-------

Allow developers to write resource store addons to do interesting things with resources


specifically, allow the application authors to write resource store addons to accomplish interesting things with resources

provide a mechanism so that addons can use AOP on the resource store (including addons)
provide a mechanism for other kinds of future-enabling extension points
allow custom (app-author provided) context-to-selector mapping
allow custom (app-author provided) resource types


Benefits
--------

- developers can customize certain core features of Mojito through resource store addons, such as routing, selector
- developers can create new resource types


How it Works?
-------------

#. loading resources from disk, resolving versions (as described above)
#. precalculating YUI module dependencies
#. expanding the specs into full instances
#. loading and parsing (via YCB) configuration files
#. (slightly) special loading of the routes files
#. calculating static handler URLs
#. calculating rollups and inline CSS

Resource Metadata
=================

Location
--------

Metadata Object
---------------

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


Resource Store Addons
=====================

Intro
-----



Requirements
------------

Core Addons
-----------

How They Work
`````````````

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


Additional Addons
-----------------

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







==============
Resource Store
==============


.. _resource_store_intro:

Intro
=====

The Resource Store (RS) is the Mojito substystem that manages metadata about the files in your Mojito applications.
The Resource Store (RS) manages metadata about the files in the application.  Thus,
it is responsible for finding and classifying code and configuration files.



.. _intro-who:

Who Needs to Know About the Resource Store?
-------------------------------------------

Most Mojito application developers will not need to know much about the resource store other than what it does. Advanced Mojito application developers who
want to track new files types or modify information that the RS tracks through metadata.

.. _intro-use:

How Can the Resource Store Help Developers?
-------------------------------------------

Developers can write addons for the resource store to have finer grain control over the management of resources
or extend the functionality of the resource store. As a developer, you can write custom addons to use AOP
on the resource store, create resource types, and map contexts to selectors.

Yes, if an advanced developer wants to write a Mojito commandline tool 
to do interesting things with files/resources in the application.  For 
example, all of our commandline tools (except `start`) use the resource 
store.
         
Writing a RS addon lets a dev teach the RS how to track new file types, 
augment the information that RS stores about file/code, or augment or 
replace the information returned by RS.            
         

.. _intro-what:

What is a Resource?
-------------------

"A Mojito resource can be a unit of code or configuration that Mojito 
applications can include and use."  

A Mojito resource can be a unit of code or configuration that Mojito applications can include and use.
At the application level, resources include archetypes, commands, configuration files, and middleware. At the mojit level,
resources include controllers, models, binders, configuration files, and views. Developers can also create their own types of
resources to fit the need of their applications. See `Types of Resources <metadata_obj-types_resources>`_ for descriptions of the 
built-in resource types.

.. From Drew's doc:

Although, for Mojito, a "resource" is primarily something useful found on the filesystem,
the RS primarily cares about the *metadata* about each file.  So, a "resource" in the RS
is an object containing metadata.

Since there can be multiple files which are all conceptually different versions of the
same thing (think `views/index.mu.html` and `views/index.iphone.mu.html`), the RS defines
"resource version" as the metadata about each file and "resource" as the metadata
about the file chosen among the possible choices.

The process of choosing which version of a resource to use is called "resolution" (or
"resolving the resource").  This act is one of the primary responsibilities of the Resource Store.
See "resolution and priorities" below.

Some resources (and resource versions) are "mojit-level":  the resource is scoped to a mojit.
Examples are controllers, views, and binders.

Some resources (and resource versions) are "shared", which means that they are included in *all*
mojits.  Most resource types that are "mojit-level" can also be shared.  Examples of mojit-level
resource types that can't be shared are controllers, config files (such as `definition.json`), and
YUI language bundles.

Some resources are "app-level".  These resources are truly global to the application.
Some example resource types are middleware, RS addons, architetypes, and commands.
(As an implementation detail, the RS still tracks resource versions for these kinds of resources
and then resolves those versions down to a chosen resource, even though there's only one version
of each resource.  More work at server start, but less code to write and debug.)

The RS primarily manages metadata about resources, so it calls the 
metadata the "resource".  The "resource" is just a JS object containing 
metadata.  The RS define certain keys with specific meanings.  RS addons 
can add, remove, or modify those keys/values as they see fit.  (For 
example, it is the yui RS addon that adds the "yui" key with metadata 
about resources that are YUI modules.  The RS itself doesn't populate 
the "yui" key of each resource.)   

.. _intro-do:

How Does the Resource Store Work?
----------------------------------

Resource store addons 

The code for the resource store is a `YUI Base <http://yuilibrary.com/yui/docs/base/>`_, which enables plugins to be implemented as `YUI Plugin modules <http://yuilibrary.com/yui/docs/plugin/>`_.
Being a YUI Base, the resource store also provides an event subsystem and a simple aspect-oriented subsystem (methods ``beforeHostMethod`` and ``afterHostMethod``). 

Mojito addons 

Understanding the workflow of the resource store will give help those who want to customize addons to write code and
help others who don't plan on customizing addons to debug. 

In short, the resource store walks through the application-level, 
mojit-level, and ``npm`` module files (in that order) of a Mojito application, determines what type of resource each file is, 
creates an instance of the resource, and then registers the instance.

During this process, the resource store is also doing the following:

- precalculating ("resolving") which resource versions are used for each version of the mojit.
- keeping track of app-level resources (archetypes, commands, config files, and middleware).
- providing methods for events, including those specialized for AOP.
- explicitly using the addons `selector <intro-selector>`_ and `config <intro-config>`_

To see the code for the resource store, see `store.server.js <https://github.com/yahoo/mojito/blob/develop/source/lib/store.server.js>`_.


Resource Store Addons
=====================

The resource store uses addons to do much of the work, which you can read about in `Built-In Resource Store Addons <resource_store-builtin_addons>`_.

Also, a RS "addon" is implemented using the YUI "plugin" mechanism. 
"addon" is the Mojito terminology, and "plugin" is the YUI terminology.     

.. _resource_store-metadata:

Resource Metadata
=================

.. _metadata-intro:

Intro
-----

The resource store uses metadata to find, load, parse, and create instances of resources. 


.. _metadata-location:

Location
--------

The resource metadata is generated by code -- it has no representation 
on the filesystem.  It is generate during `preload()`, either by the RS 
itself or by RS addons.   

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

.. 5. Need a description for ``subtype`` and examples.

.. 6. What are the Mojito subsystems that addons can be added to? 

.. 7. Do we have a better description for ``name``? Any syntax convention, default values, or possible values?

.. 8. What "filesystem details" are given for ``fs``?

.. 9. What "package details" are given for ``pkg``?

.. 10. Can you explain what the ``yui`` property does? Is it a Boolean that determines whether a resource is a YUI module or does it give info about the resource that is a YUI module?



.. Please fill in or correct the rows for the 'Required?', 'Default Value', 'Possible Values', and 'Description' columns below.

ome values do have defaults, but it depends on the value of the "type" 
key, and/or comes from the filename of the resource being represented. 
For example, the "affinity" of views is "common" (since views are used 
on both client and server), however the "affinity" for controllers comes 
from the filename.        

+------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
| Property               | Data Type     | Required? | Default Value | Possible Values             | Description                                 |
+========================+===============+===========+===============+=============================+=============================================+
| ``affinity``           | string        | --        | --            | ``server``, ``client``,     | The affinity of the resource, which         |
|                        |               |           |               | ``common``                  | indicates where the resource will be used.  |
+------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
| ``fs``                 | string        | yes       | none          | N/A                         |  // filesystem details ==> ??               |
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
|                        |               |           |               |                             | of the resource.                            |
+------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
| `` pkg``               | string        | --        | none          |                             | // packaging details ==> what details?      | 
+------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
| ``selector``           | string        | no        | "*"           |                             | The version of the resource, not to be      |
|                        |               |           |               |                             | confused revisions that mark the change of  |
|                        |               |           |               |                             | the resource over time. For example, a      |
|                        |               |           |               |                             | resource could have a version for iPhones,  |
|                        |               |           |               |                             | Android devices, fallbacks, etc.            |
+------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
| `` source``            | string        | no        |               |                             | Specifies where the resource came from      |
|                        |               |           |               |                             | (not shipped to client).                    |
+------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
| ``subtype``            | string        | no        | none          | ``action``, ``binder``,     |                                             |
|                        |               |           |               | ``command``, ``middleware`` |                                             |
|                        |               |           |               | ``model``, ``view``         |                                             |
+------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
| ``type``               | string        | yes       | none          | See `Types of Resources <ty |                                             | 
|                        |               |           |               | pes_resources>`_.           |                                             |
+------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
| ``url``                | string        | no        | none          |                             | The path used to load the resource          | 
|                        |               |           |               |                             | onto the client. Used only for resources    |
|                        |               |           |               |                             | that can be deployed by reference to the    |
|                        |               |           |               |                             | client.                                     |
+------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
| ``yui``                | string        | no        | none          |                             | // for resources that are YUI modules ==??  | 
+------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+

.. 
   
   Not sure where I got the following properties, but I'm reluctant to remove them until 
   I have confirmation that they are unnecessary.

   +------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
   | ``addonType``          | string        | --        | --            |                             | Specifies the mojito subsystem to which the |
   |                        |               |           |               |                             | addon should be added and is required if    |
   |                        |               |           |               |                             | type if ``type=addon``.                     |
   +------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
   | ``assetType``          | string        | --        | --            | ``css``, ``js``, ``png``,   | Specifies the type of asset and is required |
   |                        |               |           |               | ``png``, ``swf``            | if ``type=asset``.                          |
   +------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
   | ``configType``         | string        | --        | --            |                             | Specifies the type of configuration and is  |
   |                        |               |           |               |                             | required if ``type=config``.                | 
   +------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
   | ``fsPath``             | string        | --        | none          |                             | The path on the filesystem to the resource. |     
   | ``viewEngine``         | string        | no        | none          | ``mu``, ``dust``            | Specifies the view engine being used        |
   |                        |               |           |               |                             | and is only used if ``type=view``.          | 
   +------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
   | ``viewOutputFormat``   | string        | no        | none          | ``xml``, ``html``           | Specifies the view engine being used        |
   |                        |               |           |               |                             | and is only used if ``type=view``.          | 
   +------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
   | ``yuiModuleMeta``      | string        | no        | none          |                             | Specifies the metadata, such dependencies,  |
   |                        |               |           |               |                             | languages, etc., for a YUI 3 module.        |
   +------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
   | ``yuiModuleName``      | string        | no        | none          |                             | The name of any resource delivered as a     |
   |                        |               |           |               |                             | YUI 3 module. The ``type`` must be          |
   |                        |               |           |               |                             | ``yui-module``.                             |
   +------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
   | ``yuiModuleVersion``   | string        | no        | none          |                             | The version of any resource delivered as a  |
   |                        |               |           |               |                             | YUI 3 module. The ``type`` must be          |
   |                        |               |           |               |                             | ``yui-module``.                             |
   +------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+
   | ``yuiSortedPaths``     | string        | no        | none          |                             | For any resource delivered as a YUI3 module,|
   |                        |               |           |               |                             | this is the list of YUI modules required by |
   |                        |               |           |               |                             | the module    with transitive dependencies  | 
   |                        |               |           |               |                             | resolved. The ``type`` must be              | 
   |                        |               |           |               |                             | ``yui-module``.                             |
   +------------------------+---------------+-----------+---------------+-----------------------------+---------------------------------------------+

It doesn't make sense to have a default value.  The "name" is what 
uniquely identifies the resource within type and subtype.  For example, 
views/index.mu.html might have "type:view", empty subtype, and 
"name:index".  The name should be the same for all -versions- of the 
resource, so for example views/index.iphone.mu.html would have the exact 
same type, subtype, and name as views/index.mu.html (only the "selector" 
would be different).     


.. _types_resources:

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

Subtypes
````````

Subtype is used for certain types, but not others.  For example, an 
"type:addon" resource might have "subtype:ac" for AC addons, or 
"subtype:view-engine" for view engines, or "subtype:rs" for RS addons. 
For "type:archetype" the subtypes refers to the "type" described by 
`mojito help create`.  So, you could have "subtype:app" or 
"subtype:mojit".  (There might be more in the future!)       


.. _metadata-ex:

Example
-------

.. Questions:

.. 1. Do we have an example? 

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

.. _resource_store-write_addons:

Writing RS Addons
=================

.. Note: Replace code examples with links to Mojito source once the resource store addons have been merged into master.

.. _write_addons-intro:

Intro
-----

Mojito comes with built-in resource store addons that are used by the resource store
and the Mojito framework. These resource store addons are required by the resource store and 
the Mojito framework, so particular care must be taken when creating custom versions of them. 
This chapter takes a look at the built-in resource store addons, so you can better understand their use or 
customize your own versions. 

.. Link to API docs

.. _resource_store-custom_addons:

Creating Custom Versions of Built-In RS Addons
----------------------------------------------

This section is intended only for  developers who need to override the built-in resource store
addons or create new resource store addons. In general, we recommend that you use the built-in resource
store addons.

>> I think we should, by default, -not- document these.  They have API
>> docs, so the users (which remember are advanced devs) can look at that
>> or their source code.  The two possible exceptions to that are the
>> "selector" and "url" addons, which we expect some users might want to
>> make replacements for.  Their replacements will need to follow the same
>> API, so we should document that API.  This documentation is different
>> than the API documentation for the addon itself.  That API doc says what
>> that addon implementation -does-, but the RS API docs should outline
>> what the RS -expects- the addon to do.  

"In general, we recommend that
>> you use the built-in versions of the "config" and "url" addons".  As
>> mentioned before, we'll have to document the specific requirements for
>> writing a replacement for the "selector" or "url" RS addons.  

That's true for most of the RS addons, but not all, and it's just fine 
if they write new addons.  So, perhaps "In general, we recommend that 
you use the built-in versions of the "config" and "url" addons".  As 
mentioned before, we'll have to document the specific requirements for 
writing a replacement for the "selector" or "url" RS addons.
                                                              

.. _intro-selector:

selector
````````

.. _selector-desc:

Description
~~~~~~~~~~~

The ``selector`` addon maps contexts to selectors and then returns
a priority-ordered list (POSL) of selectors. 

**Who might want to customize their own version of the addon?** 

Developers wanting to use heir own algorithm for creating the POSL or refine the mapping of contexts to selector.

.. _selector-reqs:

Requirements
~~~~~~~~~~~~

Because the ``selector`` addon is used directly by the the resource store, all implementations need to provide the following method:

``getListFromContext(ctx)``


getListFromContext(ctx)
~~~~~~~~~~~~~~~~~~~~~~~

.. Question: 

.. 1. Need description, spec, and example of ``ctx`` and return value.

**Parameters:** 

- ``ctx`` - The context that the application is running in. 

**Return:** 

.. _selector-ex:

Example
~~~~~~~




.. _url-intro:

url
```

.. _url-desc:

Description
~~~~~~~~~~~

.. Question:

.. 1. Who might want to customize their own version of the addon? 

The ``url`` addon calculates and manages the static handler URLs for resources.
The addon is not used by resource store core, but used by the static handler middleware.
Developers should not need to write their own custom version of the ``url`` addon.

After the method ``preloadResourceVersions`` sets ``res.url`` to the static handler URL
for the resource, the method ``getMojitTypeDetails`` sets the mojit's ``assetsRoot``. 
The static handler URL can be a rollup URL.


The ``url`` addon also provides a method for the static handler middleware to find the 
filesystem path for a URL.

 

Any property which wants to have control over the static handler URLs of 
the resources, including potentially serving resources from a CDN.  Such 
a property will hopefully use Shaker, so in fact the Shaker team would 
need to know how to write a "url" RS addon.  Some other properties might 
want to do some extra fancy/custom things (besides what Shaker does) so 
they might want to write a "url" RS addon.  


.. _url-reqs:

Requirements
~~~~~~~~~~~~

None.

.. _url-ex:

Example
~~~~~~~





Creating Your Own Resource Store Addons
---------------------------------------

Intro
-----



General Process
---------------

.. Use Drew's skeleton doc


Requirements
------------

.. Questions:

.. 1. What are the requirements?  (configuration, functions, objects, namespaces, etc.)

.. Answers:

.. 1.

Example
-------

Intro
``````

In this example, you will learn how to create a resource store addon to do ...


We'll take you through creating the metadata object and the ... resource store addon.
You should be able to create your own resource store addons afterward and figure out how to
customize (and override) one of the built-in resource store addons.

Creating Metadata Object
````````````````````````




Writing Addon
`````````````
.. Questions:

.. 1. Does the app-level resource store addon go in ``{app_dir}/addons/rs/``?

.. 2. Any file naming context for the resource store addon?

.. 3. Requirements that users should know for making their own resource store addons?

.. 4. Need code and high-level explanation of what's going on as well as a brief breakdown of salient points.

.. Answers:

.. 1.

.. 2. 

.. 3.

.. 4.


The ... addon will ...







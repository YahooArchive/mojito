==================
Mojito Conventions
==================


MVC
===

Your models, controllers, and views in Mojito applications are in your mojit directories
in the following location:

- ``mojits/{mojit_name}/models/``
- ``mojits/{mojit_name}/``
- ``mojits/{mojit_name}/views/``

File Names
==========

Controllers
-----------

The default controller file is ``controller.server.js``, but you can use the affinity
to determing where the controller will be executed and define different
versions of the controller with the ``selector`` property in ``application.json``.
Thus, the syntax for controllers is as follows: ``controller.{affinity}.{selector}.js``,
where ``{affinity}}`` can be ``server``, ``common``, or ``client``, and ``{selector}}``
can either be omitted or defined by the ``selector`` property in ``application.json``.

Models
------

The default model is ``model.server.js``. The syntax for the model is ``{model_name}.{affinity}.js``,
where ``{model_name}`` is a user-defined string.

Templates (Views)
-----------------

The template file when you create a Mojito application is ``index.hb.html``. The template file names
have the the following syntax: ``{action}.{selector}.{view_engine}.html``, where ``{action}`` is the
controller function being called or view specified, ``{selector}`` is defined by the ``{selector}`` property
in ``application.json``, and ``{view_engine}`` being ``hb`` for Handlebars by default or any view engine
implemented by the application developer.

Binders
-------

``{action}.js``


Mojits
======

Definitions
-----------

Mojit definitions are the files and code that constitute the mojit and are
Instances
---------

Controllers
-----------

Models
------

Binders
-------

Templates
---------

Module Names
============

Configuration
=============

Application
-----------

Routing
-------

Mojit
-----

Assets
======


Tests
=====

Unit
----

Functional
----------







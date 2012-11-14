=================
Mojito Quickstart
=================

.. _mojito_qs-prereqs:

Prerequisites
=============

**System:** Unix-based system.

**Software:** `Node.js (>= 0.6.0 < 0.8) <http://nodejs.org/>`_, `npm (> 1.0.0) <http://npmjs.org/>`_

.. _mojito_qs-install:

Installation Steps
==================

#. Get Mojito from the npm registry and globally install Mojito so that it can be run from the 
   command line. You may need to use ``sudo`` if you run into permission errors.

   ``$ npm install mojito -g``

#. Confirm that Mojito has been installed by running the help command.

   ``$ mojito help``

.. _mojito_qs-create:

Create a Mojito Application
===========================

#. ``$ mojito create app hello_world``
#. ``$ cd hello_world``
#. ``$ mojito create mojit myMojit``

.. _mojito_qs-modify:

Modify Your Application
=======================

To make the application return a string we want, replace the code in ``mojits/myMojit/controller.server.js`` with the following:

.. code-block:: javascript

  YUI.add('myMojit', function(Y, NAME) {
  
    Y.namespace('mojito.controllers')[NAME] = {

        index: function(ac) {
            ac.done('Hello, world. I have created my first Mojito app at ' + (new Date()) + '.');
        }

    };
  });

.. _mojito_qs-running:

Running the Application
=======================

#. From the ``hello_world`` application directory, start Mojito:

   ``$ mojito start``

#. Go to http://localhost:8666/@myMojit/index to see your application.

#. Stop your application by pressing **Ctrl-C**.

For a more in-depth tutorial, please see `Mojito: Getting Started <../getting_started/>`_. To learn more about Mojito, see 
the `Mojito Documentation <../>`_.


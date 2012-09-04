

===================
Mojito Command Line
===================

Mojito comes with a command line tool that provides a number of key capabilities for the developer, 
from generating code skeletons, to running tests and test coverage, to cleaning up and documenting 
the code base.

.. _mj_cmdlne-help:

Help
####

To show top-level help for this command line tool:

``$ mojito help``

To show help for a specific command:

``$ mojito help <command>``

.. _mj_cmdlne-create_code:

Creating Code from Archetypes
#############################

Archetypes are used to create skeletons for the different types of artifacts in a Mojito application. 
The skeletons only contain stripped down boilerplate code that is easier to create using the 
command-line tool rather than by hand.

To create a skeleton for a Mojito application:

``$ mojito create app [<archetype-name>] <app-name>``

This will create an empty application (i.e. one with no mojits) with the name provided. The 
application is created in a directory named ``<app-name>`` within the current directory. If no 
archetype name is provided, the default archetype is used.

From the application directory, use the following command to create a skeleton for a mojit:

``$ mojito create mojit [<archetype-name>] <mojit-name>``

This will create an empty mojit with the name provided. The command assumes it is being executed 
within an application directory. Thus, the mojit is created in a directory named ``<mojit-name>`` 
within a ``mojits`` subdirectory of the application directory. For example, the mojit ``MyMojit`` 
would be created in ``mojits/MyMojit``.

As with application creation, if no archetype name is provided, the default archetype is used. 
Depending upon the archetype, the skeleton may include any or all of controller, model, view, and 
binder.

.. ##Note:## Feature not available yet.
.. From an application directory, use the following command to create a project to build a device \
.. application where ``<archetype-name>`` can be ``android`` or ``xcode``:

.. ``$ mojito create project [<archetype-name>] <project-name>``

.. The directory ``artifacts/projects/{archetype-name}/{project-name}`` will be created. If 
.. ``<archetype-name>`` is ``android``, a project for creating an 
.. Android application using the Android SDK is generated. If ``<archetype-name>`` is ``xcode``, 
.. a project for creating an iPhone application using the 
.. Apple iOS Developer Kit is generated.

.. _mj_cmdlne-archetype:

Mojito Archetypes
#################

Mojito offers the following three archetypes for applications and mojits.

- ``simple`` - The minimal configuration and code needed to run an application.
- ``default`` - This archetype is run if no command line archetype option is specified. It is a 
  happy medium between ``simple`` and ``full``.
- ``full`` - Provides the most comprehensive configuration and code for applications.

.. _mj_cmdlne-testing:

Testing
#######

Unit tests are run using YUI Test invoked using the Mojito command-line tool. Test output is written 
to the console and also to the file ``{CWD}/artifacts/test/result.xml``, where ``{CWD}`` is
the current working directory. Note that it is not (yet) possible to specify an alternative output 
location.

- To run tests for the Mojito framework itself:

   ``$ mojito test``

   Output is written to ``{CWD}/artifacts/test/result.xml``, where ``{CWD}`` is the current working 
   directory.

- To run tests for an application:

   ``$ mojito test app <application-path>``

- To run the unit tests for a specific mojit:

   ``$ mojito test mojit <mojit-path> [<mojit-module>]``

   If a mojit module (i.e., the YUI module for a portion of the mojit) is specified, only the tests f
   or that module will be run. Otherwise all tests for the mojit will be run.

.. _mj_cmdlne-code_coverage:

Code Coverage
#############

Code coverage is invoked in the same way as unit testing, but with the added option ``--coverage`` 
or ``-c``. To run code coverage tests, you need to have Java installed.

Coverage results are written to the console and also to file in the directory 
``{CWD}/artifacts/framework/coverage/``.  As with unit tests,  it is not possible to specify an 
alternative output location.

- To run code coverage for the Mojito framework itself:

   ``$ mojito test --coverage``

- To run code coverage for Mojito applications:

   ``$ mojito test app <app-path> --coverage``

- To run code coverage for a specific mojit:

   ``$ mojito test -c mojit <mojit-path>``

.. _mj_cmdlne-start_server:

Starting the Server
###################

Use the following to start the server and run the application.

``$ mojito start [<port>] [--context "key1:value1,key2:value2,key3:value3"]``

The port number specified in the command above overrides the port number in the application 
configuration file, ``application.json``. The default port number is 8666. See 
:ref:`Specifying Context <mj_cmdline-context>` to learn how to use the ``--context`` option.



Sanitizing Code
###############

Static code analysis is run using JSLint invoked using the Mojito command-line tool. JSLint output 
is written to text files and to a ``jslint.html`` file, making it easier to view the results. The 
output file locations are specified below. Note that it is not possible to specify an alternative 
output location.

- To run JSLint on the Mojito framework code:

   ``$ mojito jslint``

   Output is written to ``{CWD}/artifacts/framework/jslint/``, where ``{CWD}`` is the current 
   working directory.

- To run JSLint on an application, including all of its (owned) mojits:

   ``$ mojito jslint app <app-name>``

   Output is written to ``{app-dir}/artifacts/jslint/``.

- To run JSLint on a specific mojit:

   ``$ mojito jslint mojit <mojit-path>``

   Output is written to ``{app-dir}/artifacts/jslint/mojits/{mojit-name}``/.

.. _mj_cmdlne-document_code:

Documenting Code
################

API documentation is generated using `YUI Doc <http://developer.yahoo.com/yui/yuidoc/>`_, which is 
invoked using the Mojito command-line tool. Documentation output is written to files in the 
locations specified below. Note that it is not (yet) possible to specify an alternative output 
location.

- To generate documentation for the Mojito framework itself:

   ``$ mojito docs mojito``

   Output is written to ``{CWD}/artifacts/docs/mojito/``, where ``{CWD}`` is the current working 
   directory.

- To generate documentation for an application, including all of its (owned) mojits, run the 
  following from the application directory:

   ``$ mojito docs app``

   Output is written to ``{app-dir}/artifacts/docs/``.

- To generate documentation for a specific mojit, run the following from the application directory:

   ``$ mojito docs mojit <mojit-name>``

   Output is written to ``{app-dir}/artifacts/docs/mojits/{mojit-name}/``.

.. _mj_cmdlne-version_info:

Version Information
###################

- To show the version for the Mojito framework itself:

   ``$ mojito version``

- To show the version for an application, run the following from the application directory: 

   ``$ mojito version app <app-name>``

- To show the version for a mojit, run the following from the application directory:

   ``$ mojito version mojit <mojit-name>``

   Showing the version of the application and mojit requires that they have a ``package.json`` file.

.. _mj_cmdlne-build_sys:

Build System
############

Mojito comes with a build command for generating an HTML5 offline Mojito application that runs in 
different environments. The command must be run inside of the application you want built.

``$ mojito build <type> [<output-path>] [--context "key1:value1,key2:value2,key3:value3"]``

Output is written to ``{app-dir}/artifacts/builds/{type}`` by default. See 
:ref:`Specifying Context <mj_cmdline-context>` to learn about the ``--context`` option.

.. _build_sys-types:

Build Types
===========

The following sections describe the available build types.

.. _build_types-html5app:

html5app
--------

To build an HTML 5 application, use the the following:

``$ mojito build html5app``

This generates a HTML5 Offline Application with a ``cache.manifest`` listing all the files that will 
be available offline. An ``index.hb.html`` page is generated from the result of calling the Web root 
``/`` of the Mojito application that this command was run within. You can build other pages by 
specifying the pages in the ``"builds": "html5app"`` object in ``application.json``. The 
`html5 <../intro/mojito_configuring.html#html5app-object>`_ object lets you add the ``manifest`` 
attribute to the ``html`` element, configure relative paths, and specify a list of URLs to pages 
to generate.

.. _mj_cmdlne-compile_sys:

Compile System
##############

Mojito comes with a compile command for generating files to optimize an application for 
production.

.. _compile_sys-syntax

Syntax
======

Compile files with the command below where ``<type>`` can have the following values: ``all``, 
``inlinecss``, ``views``, ``json``, or ``rollups``.

``$ mojito compile <options> <type>``

In addition, the compile command takes the following three options:

- ``--app``  or ``-a`` - generates files for application-level files, including files in 
  application-level mojits
- ``--clean`` or ``-c`` - cleans up compiled modules
- ``--everything`` or ``-e`` - compiles everything possible and does not require a ``<type>``
- ``--remove`` or ``-r`` - removes the files that were generated

.. note:: The ``--app`` option is not supported for the ``inlinecss``, ``views``, or ``json`` types.

.. _compile_sys-inline_css:

Compiling Inline CSS
====================

The command below creates files for adding inline CSS to a page. The CSS files in 
``/mojits/{mojit_name}/assets/`` will be automatically included as inlined CSS in the rendered 
views for mojits that are children of the ``HTMLFrameMojit``.

``$ mojito compile inlinecss``

.. _compile_sys-views:

Compiling Views
===============

The command below pre-compiles the views in ``mojit/{mojit_name}/views`` so that a mojit's 
controller and binder are attached to the views, making separate XHR call (back to the server) 
unnecessary.

``$ mojito compile views``

.. _compile_sys-config:


Compiling Configuration
=======================

The command below using the type ``json`` reads the JSON configuration files, such as the specs, 
definitions, and defaults, and compiles them into JavaScript.

``$ mojito compile json``


.. _compile_sys-rollups:

Compiling Rollups
=================

The command below consolidates the YUI modules in the mojits into a single YUI module, making only 
one ``<script>`` tag needed per page. Using the ``--app`` option creates a rollup containing all of 
the application-level YUI modules as well as all of the Mojito framework code.

``$ mojito compile rollups``

.. _compile_sys-all:

Compiling All
=============

The commands below compile inline CSS, views, and YUI modules. 

``$ mojito compile all``

``$ mojito compile -e``

.. _mj_cmdline-dependency:

Dependency Graphs
#################

The command below generates the Graphviz file ``{CWD}/artifacts/gv/yui.client.dot`` (``{CWD}`` represents
the current working directory) that describes the YUI module dependencies.

``$ mojito gv``

The ``mojito gv`` command has the following options:

- ``--client`` - inspects the files that have ``client`` and ``common`` as the affinity. The default 
  is just to inspect files that have ``server`` and ``common`` as the affinity. For example, using 
  the ``--client`` option, the file ``controller.client.js`` and ``controller.common.js`` will be 
  inspected.
- ``--framework`` - also inspects the Mojito framework files.

.. note:: To render the Graphviz files into GIF images, you need the `Graphviz - Graph Visualization 
   Software <http://www.graphviz.org/Download..php>`_.

.. _mj_cmdline-context:

Specifying Context
##################

When configuration files are read, a context is applied to determine which values will be used for 
a given key. The applied context is a combination of the dynamic context determined for each HTTP 
request and a static context specified when the server is started. See 
`Using Context Configurations <../topics/mojito_using_contexts.html>`_ for more information.

The static context can be specified by a command-line option whose value is a comma-separated list 
of key-value pairs. Each key-value pair is separated by a colon. Try to avoid using whitespace, 
commas, and colons in the keys and values.

``$ mojito start --context "key1:value1,key2:value2,key3:value3"``




=======
Testing
=======

Mojito provides a testing framework based on `YUI Test`_ that 
allows you to run unit tests for the framework, modules, applications, mojit controllers, mojit 
models, and mojit binders.

The next few sections show you how to run specific tests with the ``mojito`` command.

Conventions
===========

- Tests should be in the following directories:

     - ``{app_name}/tests`` - application tests
     - ``{app_name}/mojits/{mojit_name}/tests`` - mojit tests
     - ``{app_name}/autoload/{yui_module}/tests`` - tests for application-level YUI modules
     - ``{app_name}/mojits/{mojit_name}/autoload/{yui_module}/tests`` - tests for mojit-level YUI modules
- Syntax for the name of the test file: ``{yui_module}.{affinity}-tests.js``

  For example, the name of the unit test YUI module for the ``HelloMojit`` mojit with the ``server`` 
  affinity would be ``HelloMojit-tests.server.js``.

- The unit test YUI module should include the target module and the ``mojito-test`` module in the 
  ``requires`` array. The requires array includes the ``mojito-test`` module and the target module ``HelloMojit``:

  .. code-block:: javascript

     { requires: [ 'mojito-test', 'HelloMojit' ] }

.. note:: Test files that are **not** in a ``tests`` directory may be found by Mojito as long as the 
          file name has the suffix ``-tests``. The suggested practice though is to place all test 
          files in the ``tests`` directories shown above.

Framework Tests
===============

After you have installed Mojito, you should run the framework test to confirm that Mojito installed 
correctly and that Node.js has been given permission to access the file system.

To test the Mojito framework, run the following:

``$ mojito test``

Application Tests
=================

Running applications tests is much like running the framework tests above. The following command runs 
tests for all of the mojits of a Mojito application.

``$ mojito test app {path-to-app}/{application-name}``

To run one specific test in your application, use the following where ``[test-name]`` is either the 
YUI module or the module to be tested.

``$ mojito test app {path-to-app}/{application-name} [test-name]``

Mojit Tests
===========

You create unit tests for your mojits and execute them also using the ``mojito`` command. Mojit tests 
must require (included in the YUI ``require`` array) the module undergoing testing and the Mojito 
Test module ``mojito-test``. For example, if the ``Foo`` module was being tested, the ``requires`` 
array would include the ``Foo`` and ``mojit-test`` modules as seen 
here: ``requires: [ 'Foo', 'mojit-test']``

By default, Mojito uses the `YUI Test <http://yuilibrary.com/yuitest/>`_ framework for the 
`test harness <http://en.wikipedia.org/wiki/Test_harness>`_ and assertion functions. 
Each mojit test will be executed within a YUI instance along with its required dependencies, so you 
can be assured to only have properly scoped values.

Types of Mojit Tests
--------------------

The following three types of mojit tests exist:

- binder tests
- controller tests
- model tests

Testing Standards
=================

To use the Mojito test harness, you are required to name files and testing modules according to 
certain rules. The name of the test file must have the same `affinity <../reference/glossary.html>`_ 
as the file being tested and have the string ``-tests`` appended to the affinity. For example, the 
mojit controller with the ``common`` affinity would be ``controller.common.js``, so the name of the 
test file must be ``controller.common-tests.js``.

The ``controller.common.js`` below requires the ``Foo`` module.

.. code-block:: javascript

   YUI.add('Foo', function(Y) {
     ...
   });

To test the ``Foo``, module, the the test file ``controller.common-tests.js`` would require the 
``Foo-tests`` module as seen below.

.. code-block:: javascript

   YUI.add('Foo-tests', function(Y) {
     ...
   }, 'VERSION', {requires: ['mojito-test', 'Foo']});

Binder Tests
============

You can create multiple binder tests and place them in the ``tests/binders`` directory. For example, 
if your binder is ``binders/index.js``, the test file would be 
``tests/binders/index.common-test.js``. Notice that the affinity is ``common``, which can be used 
for binders on the client or server and is also the default binder test file.

Example
-------

Below is the binder ``index.js`` that includes the ``FooBinderIndex`` module:

.. code-block:: javascript

   YUI.add('FooBinderIndex', function(Y, NAME) {
     Y.namespace('mojito.binders')[NAME] = {
       init: function(mojitProxy) {
         this.mojitProxy = mojitProxy;
       },
       bind: function(node) {
         this.node = node;
         var nodeId = node.get('id');
         var binderId = this.mojitProxy._viewId;
         Y.log(nodeId + ' node bound', 'debug', NAME);
         if (nodeId !== binderId) {
           throw new Error("bad node binding to binder!");
         }
         this.node.append("<p>" + nodeId + " bound</p>");
       },
       _updateId: function(msg) {
         var nodeId = this.node.get('id');
         msg = msg || 'bound';
         this.node.one("p").set('innerHTML', nodeId + ' ' + msg);
       },
       handleClick: function(evt) {
         this.node.one('div').set('innerHTML', "clicked on " + new Date());
       }
     };
   }, '0.0.1', {requires: []});

The test binder file ``tests/binders/index-common-tests.js`` below includes the module 
``FooBinderIndex-tests`` and the requires ``array`` includes the ``FooBinderIndex`` module:

.. code-block:: javascript

   YUI.add('FooBinderIndex-tests', function(Y, NAME) {
     var suite = new YUITest.TestSuite(NAME),
     binder, A = YUITest.Assert;
     suite.add(new YUITest.TestCase({
       name: 'Foo binder index tests',
       setUp: function() {
         binder = Y.mojito.binders.FooBinderIndex;
       },
       tearDown: function() {
         binder = null;
       },
       'test update id': function() {
         var node = Y.Node.create("<div id='guid123'></div>");        
         binder.init({
           _guid: 'guid123'
         });
         binder.bind(node);
         binder._updateId('hello');
         var content = node.one('p').getContent();
         Y.log(content);
         A.areSame(content, 'guid123 hello', 'the node was not updated');
       }
     }));
     YUITest.TestRunner.add(suite);
   }, '0.0.1', {requires: ['mojito-test', 'node', 'FooBinderIndex']});



Controller Tests
================

A mojit can have one or more controllers that have different affinities. For each controller, you 
can create create a test controller with the same affinity or use ``controller.common-tests.js``, 
which tests controllers with any affinity. For example,  ``controller.server.js`` can be tested with 
``controller.server-tests.js`` or ``controller.common-tests.js``.

Example
-------

The ``controller.server.js`` below requires the ``Foo`` module.

.. code-block:: javascript

   YUI.add('Foo', function(Y, NAME) {
     Y.namespace('mojito.controllers')[NAME] = { 
       init: function(mojitSpec) {
         this.spec = mojitSpec;
       },
       index: function(ac) {
         ac.done();
       }
     };
   }, '0.0.1', {requires: []});

To test the controller of the ``Foo`` mojit, create a file in the tests directory called 
``controller.common-tests.js`` that includes the ``Foo-tests`` module as seen below. Note that the 
reference to the controller is gotten using ``Y.mojito.controller`` or 
``Y.mojito.controllers[NAME]``.

.. code-block:: javascript

   YUI.add('Foo-tests', function(Y, NAME) {
     var suite = new YUITest.TestSuite(NAME),
     controller = null,
     A = YUITest.Assert;
     suite.add(new YUITest.TestCase({
       name: 'Foo tests',
       setUp: function() {
         controller = Y.mojito.controller;
       },
       tearDown: function() {
         controller = null;
       },
       'test mojit': function() {
         var ac, doneCalled = false;
         A.isNotNull(controller);
         A.isFunction(controller.index);
         ac = {
           done: function(data) {
             doneCalled = true;
             A.isUndefined(data);
           }
         };
         controller.index(ac);
         A.isTrue(compCalled);
       }
     }));
     YUITest.TestRunner.add(suite);
   }, '0.0.1', {requires: ['mojito-test', 'Foo']});

Testing with the MockActionContext Object
=========================================

The ``mojito-test`` YUI module allows you to create the mock object ``MockActionContext`` to test 
without dependencies. Using the ``MockActionContext`` object, you can easily build an 
``ActionContext`` for your controller, addon, and model tests. To learn more information about using 
YUI to create mock objects, see 
`YUI Test Standalone Library: Mock Objects <http://yuilibrary.com/yuitest/#mockobjects>`_.

Using the Mock ActionContext
----------------------------

The following sections will explain the below example code that creates a simple ``MockActionContext`` 
that tests the ``done`` function and verifies it was called correctly.

.. code-block:: javascript

   var ac = new Y.mojito.MockActionContext();
   ac.expect(
     {
       method: 'done',
       args: [YUITest.Mock.Value.Object],
       run: function(data) {
         YUITest.ObjectAssert.areEqual({ just: 'testing' });
       }
     }
   );
   Y.mojito.controller.actionUnderTest(ac);
   ac.verify();

Creating the MockActionContext Object
#####################################

To mock the ``ActionContext``, the ``mojito-test`` YUI module provides the ``MockActionContext`` 
constructor that returns a mocked ``ActionContext`` as shown below:

.. code-block:: javascript

   var ac = new Y.mojito.MockActionContext();

Setting Test Expectations
#########################

To test with the ``MockActionContext`` object, you use the ``expect`` method and pass it an 
``expectation`` object containing the properties ``method``, ``args``, and ``run``. 
These properties, in turn, contain the controller method to test, the function parameters, and the 
test function.

In the code snippet below, the ``expect`` method creates a test for the controller method ``done``, 
using the ``YUITest`` module to perform an assertion on the function's return value.

.. code-block:: javascript

   ac.expect({
     method: 'done',
     args: [YUITest.Mock.Value.Object],
     run: function(data) {
       YUITest.ObjectAssert.areEqual({ just: 'testing' });
     }
   });

Configuring Mojito to Test MockActionContext Object
###################################################

To configure Mojito to use your ``MockActionContext`` object to run test, use the following:

.. code-block:: javascript

   Y.mojito.controller.actionUnderTest(ac);

If ``actionUnderTest`` function fails to call the ``done`` function, calls it more than one time, or 
calls it with the wrong parameters, the test will fail.

Running the Test
~~~~~~~~~~~~~~~~

Finally, run the expectation by call the ``verify`` method from the ``MockActionContext`` object as 
seen here:

.. code-block:: javascript

   ac.verify();


.. note:: Expectations for addons, models, and extras will be be verified automatically when you 
          call the main ``verify`` function from the  ``MockActionContext`` object.

Example Expectations
--------------------

Passing Multiple expectation Objects
####################################

You can pass many ``expectation`` objects to the ``expect`` method:

.. code-block:: javascript

   ac.assets.expect({
     method: 'preLoadImages',
     args: [YUITest.Mock.Value.Object],
     run: function(arr) {
       OA.areEqual(['thepath','thepath'], arr);
     },
     callCount: 1
     },
     {
       method: 'getUrl',
       args: [YUITest.Mock.Value.String],
       returns: 'thepath',
       callCount: 3
     },
     {
       method: 'addCss',
       args: ['thepath']
     }
   );

Chaining expect Methods
#######################

You can also chain ``expect`` methods:

.. code-block:: javascript

   ac.assets.expect(
     {
       method: 'preLoadImages',
       args: [YUITest.Mock.Value.Object],
       run: function(arr) {
         OA.areEqual(['thepath','thepath'], arr);
       },
       callCount: 1
     }).expect({
       method: 'getUrl',
       args: [YUITest.Mock.Value.String],
       returns: 'thepath',
       callCount: 3
     }).expect({
       method: 'addCss',
       args: ['thepath']
     });

Mocking Addons
--------------

To use the MockActionContext object to test different addons, you specify the namespaces of the 
addons within the ``MockActionContext`` constructor:

.. code-block:: javascript

   var ac = new Y.mojito.MockActionContext({
     addons: ['intl', 'assets']
   });
   ac.intl.expect({
     method: 'lang',
     args: ['UPDATING'],
     returns: 'updating, yo'
   });

Mocking Custom Addons
#####################

To create a custom addon that contains functions within a property, you might have an addon that is 
used in the following way:

.. code-block:: javascript

   ac.customAddon.params.get('key');

To test the addon, you pass the ``addons`` array with a list of the addons you want to test to the 
``MockActionContext`` constructor as seen below:

.. code-block:: javascript

   var ac = new Y.mojito.MockActionContext(
     {
       addons: ['customAddon'],
       extras: { customAddon: 'params'}
     }
   );

This will give you a mock object at ``ac.customAddon.params`` from which you can call ``expect``.

Mocking Models
##############

To test models with the ``MockActionContext`` object, you pass the ``models`` array with the model 
YUI modules as is done with addons:

.. code-block:: javascript

   var ac = new Y.mojito.MockActionContext(
     {
       addons: ['intl', 'params'],
       models: ['foo']
     }
   );
   ac.models.foo.expect(
     {
       method: 'getData',
       args: [YUITest.Mock.Value.Object,
       YUITest.Mock.Value.Function],
       run: function(prms, cb) {
         cb(null, {my: 'data'});
       }
     }
   );

Model Tests
===========

Model tests are largely the same as controller tests, except there can be many of them. The model 
tests are placed in the ``tests/models`` directory. You can create multiple model tests or use 
``models.common-tests.js`` to test both server and client models.

Example
-------

The ``model.server.js`` below includes the ``FooModel`` module.

.. code-block:: javascript

   YUI.add('FooModel', function(Y, NAME) {
     Y.namespace('mojito.models')[NAME] = {      
       getData: function(callback) {
         callback({some:'data'});
       }
     };
   }, '0.0.1', {requires: []});

The ``tests/models/models.common-tests.js`` test below includes the ``FooModel-tests`` module and 
the ``requires`` array contains the ``FooModel`` module.

.. code-block:: javascript

   YUI.add('FooModel-tests', function(Y, NAME) {
     var suite = new YUITest.TestSuite(NAME),
     model = null,
     A = YUITest.Assert;
     suite.add(new YUITest.TestCase({
       name: 'Foo model tests',
       setUp: function() {
         model = Y.mojito.models.Layout;
       },
       tearDown: function() {
         model = null;
       },
       'test mojit model': function() {
         A.isNotNull(model);
         A.isFunction(model.getData);
       }
     }));
     YUITest.TestRunner.add(suite);
   }, '0.0.1', {requires: ['mojito-test', 'FooModel']});

Module Tests
############

You can run specific unit tests for modules of the Mojito framework. When you test a module, Mojito 
will look for framework tests found in ``path-to-node/node/mojito/tests``.

You can provide either the YUI module name of the test or the class it is testing. For example, to 
test the module ``foo`` with the test called ``foo-test``, use either of 
the following commands:

- ``$ mojito test foo``
- ``$ mojito test foo-test``

.. _moj_tests-func_unit:

Functional/Unit Tests
=====================

Mojito comes with functional tests that you can run with the npm module 
`Arrow <https://github.com/yahoo/arrow/>`_, a testing framework that fuses together JavaScript, 
Node.js, PhantomJS, and Selenium. Arrow lets you write tests in 
`YUI Test`_ that can be executed on the client or server. 
You can also write your own functional/unit tests with Arrow. Mojito recommends that contributors
write Arrow functional/unit tests for their code to accelerate the process of merging pull requests.

The following sections show you how to set up your environment and run the unit and 
functional tests that come with Mojito. In the future, we will also provide you with instructions
for writing Arrow tests for your code contributions.

.. _func_unit-builtin:

Running Mojito's Built-In Tests
-------------------------------

.. _func_unit-reqs:

Required Software
#################

- `Java <http://www.java.com/en/download/manual.jsp>`_
- `Node.js 0.6 or higher (packaged with npm) <http://nodejs.org/>`_
- `Git <http://git-scm.com/downloads>`_

.. _func_unit_reqs-macs:

Macs
####

.. _func_unit-macs_setup:

Setting Up
~~~~~~~~~~

#. `Download PhantomJS <http://www.doctor46.com/phantomjs>`_.
#. Copy the phantomjs binary to ``/usr/local/bin/``.

   ``$ cp phantomjs /usr/local/bin/``
#. Install Arrow:

   ``$ npm install yahoo-arrow -g`` 
#. Start the Arrow server to confirm it was installed:

   ``$ arrow_server``
#. Shut down the Arrow server with ``Ctrl-C^`` command.   

.. _func_unit_reqs-linux:

Linux
#####

.. _func_unit-linux_setup:

Setting Up
~~~~~~~~~~

#. Follow the `installation instructions for PhantomJS <http://www.doctor46.com/phantomjs>`_.
#. Copy the phantomjs binary to ``/usr/local/bin/``.
#. Install Arrow:

   ``$ npm install yahoo-arrow -g``
#. Start the Arrow server to confirm it was installed:

   ``$ arrow_server``
#. Shut down the Arrow server with ``Ctrl-C^`` command.  

   
.. _func_unit-install_selenium:
   
Installing Selenium (recommended)
#################################

The following instructions work for both Macs and Linux.

#. `Download the Selenium JAR executable <http://selenium.googlecode.com/files/selenium-server-standalone-2.22.0.jar>`_.
#. Start the Selenium server:

   ``$ java -jar path/to/selenium-server.jar``
#. Confirm Selenium is running by going to the following URL: 

   `http://localhost:4444/wd/hub/static/resource/hub.html <http://localhost:4444/wd/hub/static/resource/hub.html>`_   
#. Shut down the Selenium server with ``Ctrl-C^`` command.  

.. _func_unit-run:

Running Tests
#############

.. _func_unit_run-batch:

Running Batch Tests
~~~~~~~~~~~~~~~~~~~

The following instructions show you how to run Arrow tests with the wrapper script ``run.js``,
which allows you to run batch tests. For example, you can use ``run.js`` to run all of the Mojito 
functional or unit tests with one command.

#. Clone the Mojito repository.

   ``$ git clone https://github.com/yahoo/mojito.git``
#. Change to the ``mojito`` directory.
#. Install Mojito's dependencies. Mojito needs several npm modules to 
   run tests.
   
   ``$ npm install``
#. Change to the ``tests`` directory.
#. Start the Selenium server in the background.

   ``$ java -jar path/to/selenium-server.jar &``
#. Run the unit tests for the framework and client: 

   ``$ ./run.js test -u --path unit --group fw,client,server``
#. You can also run all the functional tests with the below command. The functional tests 
   may take some time to complete, so you may want to terminate the tests with **Ctl-C**.

   ``$ ./run.js test -f --path func``
#. To view the test reports (in JSON or XML) in the following directories: 

      - ``$ ./unit/artifacts/arrowreport/``
      - ``$ ./func/artifacts/arrowreport/``

.. note:: You will not get a report if you terminated any tests before they completed. 
          Also, Selenium will display the error message ``SeleniumDriver - Failed to collect the 
	  test report`` if a previously generated report exists.

   
.. _func_unit_run-arrow:
   
Using Arrow to Run Tests
~~~~~~~~~~~~~~~~~~~~~~~~

You can also separately run unit and functional tests directly 
with the ``arrow`` command. You pass Arrow a test descriptor, which
is a JSON configuration file that describes and organizes your tests.
For an overview of Arrow and the command-line options, see 
the `Arrow README <https://github.com/yahoo/arrow/blob/master/README.md>`_.

In the following steps, you'll start a routing application, run a test with Arrow,
and then look at the test reports. Afterward, you should be able to
run some of the other tests included with Mojito.

#. Start Selenium in the background if it is not running already. You can confirm that it's running 
   by going to http://127.0.0.1:4444/wd/hub/static/resource/hub.html.
#. Change to the directory containing the routing test application.
   
   ``$ cd mojito/tests/func/applications/frameworkapp/routing``
#. Start the application specifying port 4082 in the background.
   
   ``$ mojito start 4082 &``
#. Change to the directory containing the tests for the routing applications.
   
   ``$ cd mojito/tests/func/routing``
#. Launch Firefox with ``arrow_selenium``. 
   
   ``$ arrow_selenium --open=firefox``
#. After Firefox has launched, run the functional routing tests with Arrow with the ``arrow`` command, 
   the test descriptor, and the option ``--browser=reuse``:
 
   ``$ arrow routingtest_descriptor.json --browser=reuse``
#. You should see the functional tests running in Firefox testing different routing paths.
#. As with running the ``run.js`` script, Arrow will generate reports containing  
   the results of the tests, but the report names will match the name of the 
   test descriptor and be located in the current working directory. Thus,
   you should see the test reports ``routingtest_descriptor-report.json`` and
   ``routingtest_descriptor-report.xml``.
   
   
.. _YUI Test: http://yuilibrary.com/yuitest/



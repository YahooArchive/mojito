

=======
Testing
=======

Mojito provides a testing framework based on `YUI Test <http://yuilibrary.com/yuitest/>`_ that allows you to run unit tests for the framework, modules, applications, 
mojit controllers, mojit models, and mojit binders.

The next few sections show you how to run specific tests with the ``mojito`` command.

Conventions
###########

- Tests should be in the following directories:

   - ``{app_name}/tests`` - application tests
   - ``{app_name}/mojits/{mojit_name}/tests`` - mojit tests
   - ``{app_name}/autoload/{yui_module}/tests`` - tests for application-level YUI modules
   - ``{app_name}/mojits/{mojit_name}/autoload/{yui_module}/tests`` - tests for mojit-level YUI modules
- Syntax for the name of the test file: ``{yui_module}.{affinity}-tests.js``

   For example, the name of the unit test YUI module for the ``HelloMojit`` mojit with the ``server`` affinity would be ``HelloMojit-tests.server.js``.

- The unit test YUI module should include the target module and the ``mojito-test`` module in the ``requires`` array. The requires array includes the ``mojito-test`` module and the target module ``HelloMojit``:

   .. code-block:: javascript

      { requires: [ 'mojito-test', 'HelloMojit' ] }

.. note:: Test files that are **not** in a ``tests`` directory may be found by Mojito as long as the file name has the suffix ``-tests``. 
   The suggested practice though is to place all test files in the ``tests`` directories shown above.

Framework Tests
###############

After you have installed Mojito, you should run the framework test to confirm that Mojito installed correctly and that Node.js has been given permission to access the file system.

To test the Mojito framework, run the following:

``$ mojito test``

Application Tests
#################

Running applications tests is much like running the framework tests above. The following command runs tests for all of the mojits of a Mojito application.

``$ mojito test app {path-to-app}/{application-name}``

To run one specific test in your application, use the following where ``[test-name]`` is either the YUI module or the module to be tested.

``$ mojito test app {path-to-app}/{application-name} [test-name]``

Mojit Tests
###########

You create unit tests for your mojits and execute them also using the ``mojito`` command. Mojit tests must require (included in the YUI ``require`` array) the 
module undergoing testing and the Mojito Test module ``mojito-test``. For example, if the ``Foo`` module was being tested, the ``requires`` array would include the ``Foo`` 
and ``mojit-test`` modules as seen here: ``requires: [ 'Foo', 'mojit-test']``

By default, Mojito uses the `YUI Test <http://yuilibrary.com/yuitest/>`_ framework for the `test harness <http://en.wikipedia.org/wiki/Test_harness>`_ and assertion functions. 
Each mojit test will be executed within a YUI instance along with its required dependencies, so you can be assured to only have properly scoped values.

Types of Mojit Tests
====================

The following three types of mojit tests exist:

- binder tests
- controller tests
- model tests

Testing Standards
=================

To use the Mojito test harness, you are required to name files and testing modules according to certain rules. The name of the test file must have the same 
`affinity <../reference/glossary.html>`_ as the file being tested and have the string ``-tests`` appended to the affinity. For example, the mojit controller with 
the ``common`` affinity would be ``controller.common.js``, so the name of the test file must be ``controller.common-tests.js``.

The ``controller.common.js`` below requires the ``Foo`` module.

.. code-block:: javascript

   YUI.add('Foo', function(Y) {
     ...
   });

To test the ``Foo``, module, the the test file ``controller.common-tests.js`` would require the ``Foo-tests`` module as seen below.

.. code-block:: javascript

   YUI.add('Foo-tests', function(Y) {
     ...
   }, 'VERSION', {requires: ['mojito-test', 'Foo']});

Binder Tests
============

You can create multiple binder tests and place them in the ``tests/binders`` directory. For example, if your binder is ``binders/index.js``, the test file would 
be ``tests/binders/index.common-test.js``. Notice that the affinity is ``common``, which can be used for binders on the client or server and is also the default binder test file.

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

The test binder file ``tests/binders/index-common-tests.js`` below includes the module ``FooBinderIndex-tests`` and the requires ``array`` includes the ``FooBinderIndex`` module:

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

A mojit can have one or more controllers that have different affinities. For each controller, you can create create a test controller with the same affinity or 
use ``controller.common-tests.js``, which tests controllers with any affinity. For example,  ``controller.server.js`` can be tested with ``controller.server-tests.js`` 
or ``controller.common-tests.js``.

Example
-------

The ``controller.server.js`` below requires the ``Foo`` module.

.. code-block:: javascript

   YUI.add('Foo', function(Y) {
     Y.mojito.controller = {
       init: function(mojitSpec) {
         this.spec = mojitSpec;
       },
       index: function(ac) {
         ac.done();
       }
     };
   }, '0.0.1', {requires: []});

To test the controller of the ``Foo`` mojit, create a file in the tests directory called ``controller.common-tests.js`` that includes the ``Foo-tests`` module as seen below. 
Note that the reference to the controller is gotten using ``Y.mojito.controller`` or ``Y.mojito.controllers[NAME]``.

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

The ``mojito-test`` YUI module allows you to create the mock object ``MockActionContext`` to test without dependencies. Using the ``MockActionContext`` object, 
you can easily build an ``ActionContext`` for your controller, addon, and model tests. To learn more information about using YUI to create mock objects, 
see `YUI Test Standalone Library: Mock Objects <http://yuilibrary.com/yuitest/#mockobjects>`_.

Using the Mock ActionContext
----------------------------

The following sections will explain the below example code that creates a simple ``MockActionContext`` that tests the ``done`` function and verifies it was called correctly.

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
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To mock the ``ActionContext``, the ``mojito-test`` YUI module provides the ``MockActionContext`` constructor that returns a mocked ``ActionContext`` as shown below:

.. code-block:: javascript

   var ac = new Y.mojito.MockActionContext();

Setting Test Expectations
~~~~~~~~~~~~~~~~~~~~~~~~~

To test with the ``MockActionContext`` object, you use the ``expect`` method and pass it an ``expectation`` object containing the properties ``method``, ``args``, and ``run``. 
These properties, in turn, contain the controller method to test, the function parameters, and the test function.

In the code snippet below, the ``expect`` method creates a test for the controller method ``done``, using the ``YUITest`` module to perform an assertion on the 
function's return value.

.. code-block:: javascript

   ac.expect({
     method: 'done',
     args: [YUITest.Mock.Value.Object],
     run: function(data) {
       YUITest.ObjectAssert.areEqual({ just: 'testing' });
     }
   });

Configuring Mojito to Test MockActionContext Object
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To configure Mojito to use your ``MockActionContext`` object to run test, use the following:

.. code-block:: javascript

   Y.mojito.controller.actionUnderTest(ac);

If ``actionUnderTest`` function fails to call the ``done`` function, calls it more than one time, or calls it with the wrong parameters, the test will fail.

Running the Test
~~~~~~~~~~~~~~~~

Finally, run the expectation by call the ``verify`` method from the ``MockActionContext`` object as seen here:

.. code-block:: javascript

   ac.verify();


.. note:: Expectations for addons, models, and extras will be be verified automatically when you call the main ``verify`` function from the  ``MockActionContext`` object.

Example Expectations
--------------------

Passing Multiple expectation Objects
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

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
~~~~~~~~~~~~~~~~~~~~~~~

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

To use the MockActionContext object to test different addons, you specify the namespaces of the addons within the ``MockActionContext`` constructor:

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
~~~~~~~~~~~~~~~~~~~~~

To create a custom addon that contains functions within a property, you might have an addon that is used in the following way:

.. code-block:: javascript

   ac.customAddon.params.get('key');

To test the addon, you pass the ``addons`` array with a list of the addons you want to test to the  ``MockActionContext`` constructor as seen below:

.. code-block:: javascript

   var ac = new Y.mojito.MockActionContext(
     {
       addons: ['customAddon'],
       extras: { customAddon: 'params'}
     }
   );

This will give you a mock object at ``ac.customAddon.params`` from which you can call ``expect``.

Mocking Models
~~~~~~~~~~~~~~

To test models with the ``MockActionContext`` object, you pass the ``models`` array with the model YUI modules as is done with addons:

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

Model tests are largely the same as controller tests, except there can be many of them.  The model tests are placed in the ``tests/models`` directory. You can create multiple 
model tests or use ``models.common-tests.js`` to test both server and client models.

Example
-------

The ``model.server.js`` below includes the ``FooModel`` module.

.. code-block:: javascript

   YUI.add('FooModel', function(Y, NAME) {
     Y.mojito.models.Foo = {
       getData: function(callback) {
         callback({some:'data'});
       }
     };
   }, '0.0.1', {requires: []});

The ``tests/models/models.common-tests.js`` test below includes the ``FooModel-tests`` module and the ``requires`` array contains the ``FooModel`` module.

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

You can run specific unit tests for modules of the Mojito framework. When you test a module, Mojito will look for framework tests found in ``path-to-node/node/mojito/tests``.

You can provide either the YUI module name of the test or the class it is testing. For example, to test the module ``foo`` with the test called ``foo-test``, use either of 
the following commands:

- ``$ mojito test foo``
- ``$ mojito test foo-test``



=======
Testing
=======

Mojito provides a testing framework based on `YUI Test`_ that 
allows you to run unit tests for modules, applications, mojit controllers, 
mojit models, and mojit binders.

The next few sections show you how to run specific tests with the ``mojito`` 
command.

.. _mojito_testing-conventions:

Conventions
===========

- Tests should be in the following directories:

     - ``{app_name}/tests`` - application tests
     - ``{app_name}/mojits/{mojit_name}/tests`` - mojit tests
     - ``{app_name}/yui_modules/{yui_module}/tests`` - tests for 
       application-level YUI modules
     - ``{app_name}/mojits/{mojit_name}/yui_modules/{yui_module}/tests`` - tests for 
       mojit-level YUI modules
- Syntax for the name of the test file: ``{yui_module}.{affinity}-tests.js``

  For example, the name of the unit test YUI module for the ``HelloMojit`` mojit 
  with the ``server``   affinity would be ``HelloMojit.server-tests.js``.

- The unit test YUI module should include the target module and the ``mojito-test`` 
  module in the ``requires`` array. The requires array includes the ``mojito-test`` 
  module and the target module ``HelloMojit``:

  .. code-block:: javascript

     { requires: [ 'mojito-test', 'HelloMojit' ] }

.. note:: Test files that are **not** in a ``tests`` directory may be found by 
          Mojito as long as the file name has the suffix ``-tests``. The 
          suggested practice though is to place all test files in the ``tests`` 
          directories shown above.

.. _mojito_testing-application:

Application Tests
=================

The following command runs tests for all of the mojits of a Mojito application.

``$ mojito test app {path-to-app}/{application-name}``

To run one specific test in your application, use the following where ``[test-name]`` is 
either the YUI module or the module to be tested.

``$ mojito test app {path-to-app}/{application-name} [test-name]``

.. _mojito_testing-mojit:

Mojit Tests
===========

You create unit tests for your mojits and execute them also using the ``mojito`` 
command. Mojit tests must require (included in the YUI ``require`` array) the 
module undergoing testing and the Mojito Test module ``mojito-test``. For 
example, if the ``Foo`` module was being tested, the ``requires`` array would 
include the ``Foo`` and ``mojit-test`` modules as seen here: 
``requires: [ 'Foo', 'mojit-test']``

By default, Mojito uses the `YUI Test <http://yuilibrary.com/yuitest/>`_ 
framework for the `test harness <http://en.wikipedia.org/wiki/Test_harness>`_ 
and assertion functions. Each mojit test will be executed within a YUI 
instance along with its required dependencies, so you can be assured to only 
have properly scoped values.

.. _mojit_testing-types:

Types of Mojit Tests
--------------------

The following two types of mojit tests exist:

- controller tests
- model tests

.. _mojito_testing-standards:

Testing Standards
=================

To use the Mojito test harness, you are required to name files and testing 
modules according to certain rules. The name of the test file must have the 
same `affinity <../reference/glossary.html>`_ as the file being tested and 
have the string ``-tests`` appended to the affinity. For example, the mojit 
controller with the ``common`` affinity would be ``controller.common.js``, 
so the name of the test file must be ``controller.common-tests.js``.

The ``controller.common.js`` below registers the ``Foo`` module.

.. code-block:: javascript

   YUI.add('Foo', function(Y) {
     ...
   });

To test the ``Foo``, module, the the test file ``controller.common-tests.js`` would 
require the ``Foo`` and 'mojito-test' modules as seen below.

.. code-block:: javascript

   YUI.add('Foo-tests', function(Y) {
     ...
   }, 'VERSION', {requires: ['mojito-test', 'Foo']});


.. _mojito_testing-controller:

Controller Tests
================

A mojit can have one or more controllers that have different affinities. For each 
controller, you can create create a test controller with the same affinity or use 
``controller.common-tests.js``, which tests controllers with any affinity. For example, 
``controller.server.js`` can be tested with ``controller.server-tests.js`` or 
``controller.common-tests.js``.

.. _controller_tests-ex:

Example
-------

The ``controller.server.js`` below requires the ``Foo`` module.

.. code-block:: javascript

   YUI.add('Foo', function(Y, NAME) {
     Y.namespace('mojito.controllers')[NAME] = { 
       index: function(ac) {
         ac.done();
       }
     };
   }, '0.0.1', {requires: []});

To test the controller of the ``Foo`` mojit, create a file in the tests 
directory called ``controller.common-tests.js`` that includes the ``Foo-tests`` 
module as seen below. Note that the reference to the controller is gotten 
using ``Y.mojito.controllers[NAME]``.

.. code-block:: javascript

   YUI.add('Foo-tests', function(Y, NAME) {
     var suite = new YUITest.TestSuite(NAME),
     controller = null,
     A = YUITest.Assert;
     suite.add(new YUITest.TestCase({
       name: 'Foo tests',
       setUp: function() {
         controller = Y.mojito.controllers.Foo;
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
         A.isTrue(doneCalled);
       }
     }));
     YUITest.TestRunner.add(suite);
   }, '0.0.1', {requires: ['mojito-test', 'Foo']});

.. _mojito_testing-mockactioncontext:

Testing with the MockActionContext Object
=========================================

The ``mojito-test`` YUI module allows you to create the mock object
``MockActionContext`` to test without dependencies. Using the 
``MockActionContext`` object, you can easily build an ``ActionContext`` 
for your controller, addon, and model tests. To learn more information 
about using YUI to create mock objects, see 
`YUI Test Standalone Library: Mock Objects <http://yuilibrary.com/yuitest/#mockobjects>`_.

.. _mockactioncontext_testing-using:

Using the Mock ActionContext
----------------------------

The following sections will explain the below example code that creates a 
simple ``MockActionContext`` that tests the ``done`` function and verifies 
it was called correctly.

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


.. _mockactioncontext_testing-creating:

Creating the MockActionContext Object
#####################################

To mock the ``ActionContext``, the ``mojito-test`` YUI module provides the 
``MockActionContext`` constructor that returns a mocked ``ActionContext`` 
as shown below:

.. code-block:: javascript

   var ac = new Y.mojito.MockActionContext();

.. _mockactioncontext_testing-expectations:

Setting Test Expectations
#########################

To test with the ``MockActionContext`` object, you use the ``expect`` method 
and pass it an ``expectation`` object containing the properties ``method``, 
``args``, and ``run``. These properties, in turn, contain the controller 
method to test, the function parameters, and the test function.

In the code snippet below, the ``expect`` method creates a test for the 
controller method ``done``, using the ``YUITest`` module to perform an 
assertion on the function's return value.

.. code-block:: javascript

   ac.expect({
     method: 'done',
     args: [YUITest.Mock.Value.Object],
     run: function(data) {
       YUITest.ObjectAssert.areEqual({ just: 'testing' });
     }
   });

.. _mockactioncontext_testing-configure:

Configuring Mojito to Test MockActionContext Object
###################################################

To configure Mojito to use your ``MockActionContext`` object to run test, 
use the following, where ``{actionUnderTest}`` is the action you are testing.

.. code-block:: javascript

   Y.mojito.controller.{actionUnderTest}(ac);

If the ``{actionUnderTest}`` function fails to call the ``done`` function, calls 
it more than one time, or calls it with the wrong parameters, the test will 
fail.

.. _mockactioncontext_testing-run:

Running the Test
****************

Finally, run the expectation by call the ``verify`` method from the 
``MockActionContext`` object as seen here:

.. code-block:: javascript

   ac.verify();


.. note:: Expectations for addons, models, and extras will be be verified 
          automatically when you call the main ``verify`` function from the 
          ``MockActionContext`` object.

.. _mockac_testing_expectations-ex:

Example Expectations
--------------------

.. _testing_expectations_ex-pass_objs:

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

.. _testing_expectations_ex-chain_methods:

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

.. _mock_addons:

Mocking Addons
--------------

To use the MockActionContext object to test different addons, you specify 
the namespaces of the addons within the ``MockActionContext`` constructor:

.. code-block:: javascript

   var ac = new Y.mojito.MockActionContext({
     addons: ['intl', 'assets']
   });
   ac.intl.expect({
     method: 'lang',
     args: ['UPDATING'],
     returns: 'updating, yo'
   });




.. _mock_custom_addons:

Mocking Custom Addons
#####################

To create a custom addon that contains functions within a property, you might 
have an addon that is used in the following way:

.. code-block:: javascript

   ac.customAddon.params.get('key');

To test the addon, you pass the ``addons`` array with a list of the addons 
you want to test to the ``MockActionContext`` constructor as seen below:

.. code-block:: javascript

   var ac = new Y.mojito.MockActionContext(
     {
       addons: ['customAddon'],
       extras: { customAddon: 'params'}
     }
   );

This will give you a mock object at ``ac.customAddon.params`` from which you can 
call ``expect``.

.. _mock_models:

Mocking Models
##############

To test models with the ``MockActionContext`` object, you pass the ``models`` 
array with the model YUI modules as is done with addons:

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

.. _mock_addons-ex:

Example MockAction Test
-----------------------

.. _mock_addons_ex-controller:

controller.server.js
####################


.. code-block:: javascript

   YUI.add('myMojit', function(Y, NAME) {
     Y.namespace('mojito.controllers')[NAME] = {
       index: function(ac) {
           ac.done({
              status: 'Mojito is working.',
           });
         }
       };
   }, '0.0.1', {requires: ['mojito', 'myMojitModelFoo']});

.. _mock_addons_ex-controller_test:

controller.server-tests.js
##########################

.. code-block:: javascript

   YUI.add('tester-tests', function(Y) {
     var suite = new YUITest.TestSuite('tester-tests'),
         controller = null,
         A = YUITest.Assert;

     suite.add(new YUITest.TestCase({
       name: 'tester user tests',
       setUp: function() {
         controller = Y.mojito.controllers.tester;
       },
       tearDown: function() {
         controller = null;
       },
       'test mojit': function() {
         var ac = new Y.mojito.MockActionContext({});
         A.isNotNull(controller);
         A.isFunction(controller.index);
         ac.expect({
           method: 'done',
           args: [YUITest.Mock.Value.Object],
           callCount: 1,
           run: function(data){
             YUITest.ObjectAssert.areEqual({ status: 'Mojito is working.' },data);
           }
         });
         controller.index(ac);
         ac.verify();
       }
     }));
     YUITest.TestRunner.add(suite);
   }, '0.0.1', {requires: ['mojito-test', 'myMojit']});


.. _mojito_testing-models:

Model Tests
===========

Model tests are largely the same as controller tests, except there can be 
many of them. The model tests are placed in the ``tests/models`` directory. 
You can create multiple model tests or use ``models.common-tests.js`` to test 
both server and client models.

.. _mojito_testing_models-ex:

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

The ``tests/models/models.common-tests.js`` test below includes the 
``FooModel-tests`` module and the ``requires`` array contains the ``FooModel`` 
module.

.. code-block:: javascript

   YUI.add('FooModel-tests', function(Y, NAME) {
     var suite = new YUITest.TestSuite(NAME),
     model = null,
     A = YUITest.Assert;
     suite.add(new YUITest.TestCase({
       name: 'Foo model tests',
       setUp: function() {
         model = Y.mojito.models.FooModel;
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


.. _moj_tests-func_unit:

Mojito Built-In Functional/Unit Tests
=====================================

Mojito allows you to use ``npm test`` to run tests and also 
comes with the script ``run.js`` that allows you to have more control over the test(s) 
you want to run and where you want to write the test results.

Mojito uses the npm module  `Arrow <https://github.com/yahoo/arrow/>`_, a testing framework 
that fuses together JavaScript, Node.js, PhantomJS, and Selenium. By running the built-in
unit and functional tests, contributors can accelerate the merging of
their pull request.

Before making pull requests, we recommend contributors do the following:

#. Read `Contributing Code to Mojito <https://github.com/yahoo/mojito/wiki/Contributing-Code-to-Mojito>`_.
#. Follow the instructions in :ref:`Running Mojito's Built-In Tests <func_unit-builtin>`
   to learn how to set up your environment and run the Mojito built-in tests.
#. Fork Mojito.
#. Make your code changes.
#. Run the built-in unit and functional tests to make sure your code changes haven't
   broken Mojito.
#. Create a global symbolic link to your Mojito fork with ``npm link`` and then 
   try running your own applications.
#. Everything working? Great, make your pull request and don't forget to 
   unlink your fork of Mojito.

The following sections show you how to set up your environment and run the unit 
and functional tests that come with Mojito. 


.. _func_unit-builtin:

Running Mojito's Built-In Tests
-------------------------------

.. _func_unit-reqs:

Required Software
#################

- `Java <http://www.java.com/en/download/manual.jsp>`_
- `Git <http://git-scm.com/downloads>`_
- `Firefox v20 <http://www.mozilla.org/en-US/products/download>`_

Optional Software
#################

To run functional tests in a browser, you need to :ref:`install the Selenium 
Server <func_unit-install_selenium>`.


Setting Up 
##########

#. Clone the Mojito repository.

   ``$ git clone https://github.com/yahoo/mojito.git``
#. Change to the ``mojito`` directory.
#. Install the Mojito dependencies:

  ``$ npm install``

.. _func_unit_phantomjs-run:   

Running Tests with PhantomJS
############################

By default, Mojito uses the npm package ``phantomjs`` for running tests.
You can use ``npm`` to run functional and unit tests.

For more control over the running tests, such as running one test or specifying a 
different location to write test results, use the wrapper script ``run.js`` that
comes with Mojito. 

.. _npm_phantomjs-run:  

Using npm
*********

#. From the ``mojito`` directory, run both the unit and functional tests with ``npm``:

   ``$ npm test``
#. To run only unit tests, use the following:

   ``$ npm run-script unit``
#. To run only functional tests, use the following:

   ``$ npm run-script func``


.. _runjs_phantomjs-run:

Using run.js
************

#. Change to the ``mojito/tests`` directory.
#. To run the functional tests, you use the option ``-u`` and specify
   the path with the option ``--path``:
   
   ``$ ./run.js test –u —path unit —browser phantomjs``

#. To run individual unit and functional tests, you pass the test descriptor (JSON test 
   configuration file) to ``run.js``. 

   ``$ ./run.js test -f --path func --descriptor examples/newsboxes/newsboxes_descriptor.json --port 4000 --browser phantomjs``



.. _func_unit_selenium-run:   

Running Tests with Selenium
###########################

To run tests in a browser, you need the `Selenium Server <func_unit-install_selenium>`_
and browser drivers. Selenium Server comes with a driver for Firefox, so do not need to 
install the Firefox driver. To run tests in Chrome and other browsers, you will need to 
`install the appropriate drivers <https://code.google.com/p/selenium/w/list>`_. In the 
steps below, we'll just be using the default browser Firefox.

#. Install Selenium:
   
   #. `Download the Selenium v2.31.0 JAR executable <http://selenium.googlecode.com/files/selenium-server-standalone-2.31.0.jar>`_.
   #. Start the Selenium server:
 
      ``$ java -jar path/to/selenium-server-standalone-2.31.0.jar``
   #. Confirm Selenium is running by going to the following URL: 

     `http://localhost:4444/wd/hub/static/resource/hub.html <http://localhost:4444/wd/hub/static/resource/hub.html>`_   
   #. Shut down the Selenium server with ``Ctrl-C`` command.  

      .. warning:: If you are not using Firefox v20 and the Selenium Standalone Server v2.31.0, you 
                   may run into backward compatibility issues. Please see the 
                   `Platforms Supported by Selenium <http://docs.seleniumhq.org/about/platforms.jsp>`_
                   to learn what Selenium and browser versions are compatible.

#. Change to the ``mojito/tests`` directory.
#. Start the Selenium server in the background.

   ``$ java -jar path/to/selenium-server.jar &``
#. Run the unit tests for the framework and client. As we mentioned before, the default 
   browser is Firefox. To specify Chrome, you would add the option ``--browser chrome``.

   ``$ ./run.js test -u --path unit --group fw,client,server --reuseSession``
#. You can also run all the functional tests with the below command. 

   ``$ ./run.js test -f --path func --port 4000``

   The functional tests may take some time to complete, so you may want to 
   terminate the tests with **Ctl-C**. Also, you do not need to specify the port
   with ``--port``, but the command above does to show you the option.
#. To run individual unit and functional tests, you pass the test descriptor
   to ``run.js``. 

   ``$ ./run.js test -f --path func --descriptor examples/newsboxes/newsboxes_descriptor.json --port 4000 --reuseSession``

   The command above runs the functional test for the
   ``newsboxes`` application. The ``--path`` option indicates that the 
   path to the test descriptor is located in the ``func`` directory: ``func/examples/newsboxes/newsboxes_descriptor.json`` 

.. _test_results:  

Test Results
############

Test results are written in both XML and JSON. You can specify the location to write
test results or use the default location. In the following sections, we'll look at the 
default locations and the way to specify the location for unit and functional tests.

.. _test_results-unit:

Unit Tests
**********

* Default location when running ``npm test``:

  * unit tests (XML) - ``mojito/tests/unit/artifacts/arrowreport/result.xml``
  * unit tests (JSON) - ``mojito/tests/unit/artifacts/arrowreport/result.json``

* Use the option ``--reportFolder`` to specify the location to write test results:

  ``$ ./run.js test -u --path unit --browser phantomjs --reportFolder <dir>``

.. _test_results-func:

Functional Tests
****************

* Default Location when running ``npm test``:

  * functional tests (XML) - ``mojito/artifacts/arrowreport/result.xml``
  * functional tests (JSON) - ``mojito/artifacts/arrowreport/result.json``  

* As with the test results for unit tests, use the option ``--reportFolder`` to specify the 
  location to write test results. 

  ``$ ./run.js test -u --path unit --browser phantomjs --reportFolder <dir>``

   .. warning:: Do not write your test results to ``mojito/tests`` as the results
                for each test will overwrite the results of prior tests. This is
                why the default location is ``mojito/artifacts/arrowreport`` and
                not ``mojito/tests/``.

   
   
.. _YUI Test: http://yuilibrary.com/yuitest/



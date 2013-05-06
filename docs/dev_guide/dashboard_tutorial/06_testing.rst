========================
6. Writing Tests (Draft)
========================

Introduction
============

Our application has gotten complicated enough that we need to write some tests. 
We’re going to show you how to write unit and functional tests in this module, 
and we’re also going to add a few more mojits to fill out our dashboard. We 
already saw the Mojito CLI has a test command for running unit tests. To run 
functional tests, we’re going to use Arrow, which is an npm module that we’ll 
need to install.

Estimated Time
--------------
15 minutes

What We’ll Cover
----------------

- unit tests 
- model tests
- controller tests
- functional tests with Arrow

Final Product
-------------

The main focus of this module is testing in Mojito, but as you can see from the 
screenshot, we’ve added some more mojits to flesh out the dashboard.

Before Starting
---------------

Review of the Last Module
#########################

We focused on getting data in the last module using YQL and the Mojito REST library.  
In Mojito applications, you want to use YQL whenever you can, and YUI makes it 
easier by having a YQL module. In certain cases, you may need to use the REST module 
because there is no YQL table available or because certain Web Services like Twitter 
set limitations on YQL making requests to the Twitter API.

We covered the following in the last module:

- mojit model
- YQL intro
- YQL statements
- YQL module
- REST module
- calling model from the controller

Setting Up
##########

#. ``$ cp -r 05_getting_data 06_testing``

#. Install Selenium and confirm that it works:
   
   * Download the Selenium JAR executable.
   * Start selenium: ``$ java -jar path/to/selenium-server.jar``
   * Confirm that Selenium is running by opening the following URL in a browser: http://localhost:4444/wd/hub/static/resource/hub.html
#. From the 06_testing directory, install Arrow: 
  
   ``$ npm install arrow``

Source Code for Example
#######################

``[app_part{x}](http://github.com/yahoo/mojito/examples/quickstart_guide/app_part{x})``

Lesson: Testing
===============

Introduction
------------

Mojito uses YUITest for unit tests and relies on Arrow for functional tests. 
We’re going to cover unit tests in more detail, but also show you how to write 
a simple functional test with Arrow.

Unit Tests
----------

Location
########

For application tests, the tests should be in the following directory: ``{app_name}/tests``

For mojit tests, place the tests in the following directory: ``{app_name}/mojits/{mojit_name}/tests``

Model tests are placed in the /tests/models directory for both application and mojit tests. 
You can also have tests for YUI modules, but we won’t be writing tests for YUI modules in 
this module.

File Name Convention
####################

For controller tests, the test file name has the following syntax: ``controller.{affinity}-tests.js``

For models, the test file name is slightly different: ``{model_name}.{affinity}.js``

If you remember, the twitterMojit had the model twitter.server.js, so the test file 
for the model would be twitter.server-tests.js. 

Writing Tests
#############

As we mentioned in the introduction, unnit tests in Mojito use the testing framework YUI Test. 
To use the testing framework, you require  ‘mojito-test’ in your test files and the module 
name that is being tested. For example, in the code snippet below, the testing framework is 
included as well as the module that is being tested (‘githubMojit’).

``{ requires: [ 'mojito-test', 'githubMojit' ] }``

Test Components
###############

Before we look at the unit tests for Mojito, let’s take a look at the core components of YUI tests, 
so you’ll have a better understanding of how the Mojito tests work.

Test Suites 
***********

Test suites are just a way of grouping test cases together for a module. 

Example: ``var suite = new YUITest.TestSuite('myMojit-tests');``

Test Cases
**********

Test cases are methods designed to test a specific piece of functional code. The test methods 
are named as typical JavaScript methods or using a string describing what the method does, 
such as “test mojit” purpose.  Test cases use the  setUp method before each and every test 
in the test case to set up objects or variables needed by the test methods. The tearDown method 
is run after each test is run to free up memory after the test is run. The methods themselves 
often use assertions to verify the validity of a particular action or function.

Example:

.. code-block:: javascript

   var test_case1 = new YUITest.TestCase({
     name: 'myMojit user tests',
     setUp: function() {
       controller = Y.mojito.controllers.myMojit;
     },
     tearDown: function() {
       controller = null;
     },
     'test mojit': function() {
        // Add test code/assertions here
     }
   });


Test Runners
************

The test runner is a singleton object that simply runs all of the tests in test cases and suites, 
reporting back on passes and failures. Typically, you would call the run method in YUI tests, 
but Mojito calls run for you when running mojito test. 

Example: ``YUITest.TestRunner.add(suite);``

Assertions
**********

Assertions are methods that check the validity of a particular action or function. If the action or 
function is not valid, the assertion method throws an error that causes the test to fail. When all 
assertions pass within a test method, the test  is said to have passed. The YUI Test framework has 
assertion methods for testing equality, sameness, data types, special values, and forced failures. 
Please see the  YUI Assertion documentation for details.

Example:  

.. code-block:: javascript

   var A = YUITest.Assert;
   A.isNotNull(controller);


Mock Objects
************

Mock objects are used to eliminate test dependencies on other objects. In Mojito, you often 
create a mock version of the ActionContext object to test methods such as done. The expect method 
allows you to set up expectations for the mock object that can later be verified with the verify 
method. The example below helps illustrate how the two methods work together.

Example:

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
   ac.verify();

Controller Tests
----------------

Now that you have a basic understanding of YUI test, writing controller tests should be 
fairly easy. You’ll need to do one thing specific to Mojito and that is get the YUI module 
of the controller to test. You do this by requiring the YUI module name for the controller 
and then accessing the controller code with the following: ``Y.mojito.controller.{YUI_module_name}``


Thus, if we were going to test the controller with the register YUI module name myMojit, we 
would have ‘myMojit’ in the required array and assign Y.mojito.controller.myMojit to a variable 
in the test as shown below:

.. code-block:: javascript

   YUI.add('myMojit-tests', function(Y) {
     var suite = new YUITest.TestSuite('myMojit-tests'),
         controller = null,
         A = YUITest.Assert;

     suite.add(new YUITest.TestCase({

       name: 'myMojit user tests',
       setUp: function() {
         // Fetch the module for the controller
         controller = Y.mojito.controllers.myMojit;
       },
       ... 
     YUITest.TestRunner.add(suite);
     // Include the module as a dependency for the test
   }, '0.0.1', {requires: ['mojito-test', 'myMojit']});


Putting the Components Together
-------------------------------

You create a test suite with the name passed to the test 
module:

.. code-block:: javascript

   YUI.add('githubMojit-tests', function(Y, NAME) {
     var suite = new YUITest.TestSuite(NAME);

You add a test case to the suite with a setUp method that accesses the 
controller object and a tearDown method to remove the object from memory: 

.. code-block:: javascript

   ...
     suite.add(new YUITest.TestCase({
       name: 'Foo tests',
       setUp: function() {
         controller = Y.mojito.controllers.Foo;
       },
       tearDown: function() {
         controller = null;
       },
   ...

Now comes the tests within the test case, but before we do that 

.. code-block:: javascript

   YUI.add('githubMojit-tests', function(Y, NAME) {
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

.. code-block:: javascript

   YUI.add('githubMojit-tests', function (Y) {

     var suite = new YUITest.TestSuite('githubMojit-tests'),
         controller = null,
         A = YUITest.Assert;

     suite.add(new YUITest.TestCase({
       name: 'githubMojit user tests',
       setUp: function () {
         controller = Y.mojito.controllers.githubMojit;
       },
       tearDown: function () {
         controller = null;
       },
       'test mojit': function () {
         var ac,
             modelData,
             assetsResults,
             doneResults;
         modelData = { x:'y' };
         ac = {
           assets: {
             addCss: function (css) {
               assetsResults = css;
             }
           },
           models: {
             get: function (modelName) {
               A.areEqual('githubMojitModelFoo', modelName, 'wrong model name');
               return {
                 getData: function (cb) {
                   cb(null, modelData);
                 }
               }
             }
           },
           done: function (data) {
             doneResults = data;
           }
         };
         A.isNotNull(controller);
         A.isfunction (controller.index);
         controller.index(ac);
         A.areSame('./index.css', assetsResults);
         A.isObject(doneResults);
         A.areSame('Mojito is working.', doneResults.status);
         A.isObject(doneResults.data);
         A.isTrue(doneResults.data.hasOwnProperty('x'));
         A.areEqual('y', doneResults.data['x']);
       }
     }));
     YUITest.TestRunner.add(suite);
   }, '0.0.1', {requires: ['mojito-test', 'githubMojit']});

Model Tests
-----------

The model tests have the same structure as controller tests with the exception of 
how you access the module. You use Y.mojito.models.{YUI module name} to access the 
model. Again, you also have to require mojito-test and the YUI module for the model. 
The test suite, test cases, setUp/tearDown methods, and assertions all work in the same 
way. 

In the example model test that we’ll be creating later, the model with the registered 
YUI module name YoutubeMojitYQL  is required and then accessed in the setUp method.

.. code-block:: javascript

   ...
     var suite = new YUITest.TestSuite(NAME),
         model = null,
         A = YUITest.Assert;
     suite.add(new YUITest.TestCase({
       name: "YoutubeModelYQL user tests",
       setUp: function (){
         model = Y.mojito.models.YoutubeModelYQL;
       },
       ...
     ...
   }, '0.0.1', {requires: ['mojito-test', 'YoutubeModelYQL']});


.. code-block:: javascript

   YUI.add('YoutubeModelYQL-tests', function (Y, NAME) {

     var suite = new YUITest.TestSuite(NAME),
         model = null,
         A = YUITest.Assert;
     suite.add(new YUITest.TestCase({
       name: "YoutubeModelYQL user tests",
       setUp: function (){
         model = Y.mojito.models.YoutubeModelYQL;
       },
       tearDown: function (){
         mode = null;
       },
       'test mojit model': function (){
         var called = false,
             cfg = { color: 'red' };
         A.isNotNull(model);
         A.isfunction (model.init);
         model.init(cfg);
         A.areSame(cfg, model.config);

         // Check getData function is there
         A.isfunction (model.getData);

       }
     }));
     YUITest.TestRunner.add(suite);
   }, '0.0.1', {requires: ['mojito-test', 'YoutubeModelYQL']});



Running Tests
-------------

To run functional tests, you use the Mojito command-line Utility. The test command allows you to test all of the mojits of an application or specify a mojit. Mojito will test all of the unit tests in the tests directory. To test all the mojits in the application that we are going to create this module, you would use the following:

$ mojito test app .

To test our githubMojit, you would specify the mojit:

$ mojito test mojit mojits/githubMojit


Functional Tests
----------------

You could say that a functional tests is any test that is not a unit test, but for 
simplicity and our intent, we’re calling functional tests those that test the UI of an 
application. So, if you want to test the DOM or DOM events, you’re going to write functional 
tests and use Arrow. 

Intro to Arrow
##############

Arrow is a testing framework that combines JavaScript, Node.js, and Selenium. It attempts to 
make writing functional tests as easy as unit tests. In fact, you write the you can write 
both unit and functional tests using YUI Test as well, but Mojito already has a convenient 
test command for running unit tests, so we’re going to focus on Arrow functional tests. As 
this is not an Arrow guide, we’re only going to scratch the surface of using the Arrow 
testing framework. We’ll look at writing tests, running a test suite, and using the Arrow 
command. To learn more about Arrow, we highly recommend that you read the Arrow documentation. 


Writing Arrow Tests
*******************

As we’ve already said, tests for Arrow are written using YUI Test. You pass in a configuration 
object to YUI, load the modules that your test needs with the use method, and then write the 
test in the same way as you wrote unit tests: create a test suite, add a test case, and add 
the test case to the runner. Like Mojito, Arrow will call the method run for you to run the 
tests. 

The main difference between the Mojito unit tests and Arrow tests is that Mojito unit tests 
register the module name (with the method add), and Arrow tests just  load modules. The 
added difference here is that we’re using Arrow for functional tests, so the tests themselves 
are using the DOM.

In the example test for the getting started example in Mojito, the test “test hello” uses an 
assertion to confirm that the text value of the <pre> element is “Hello World!”.  In the 
example test below, the configuration object passed to YUI and the modules that are loaded 
are used for most tests, although you may need to add configurations and load more modules 
for other tests.

.. code-block:: javascript

   ...
     YUI({
       useConsoleOutput: true,
       useBrowserConsole: true,
       logInclude: { TestRunner: true }
     }).use('node', 'node-event-simulate', 'test', 'console', function (Y) {

     var suite = new Y.Test.Suite("DeveloperGuide: hello");
     suite.add(new Y.Test.Case({
       "test hello": function() {
         Y.Assert.areEqual("Hello World!", Y.one('pre').get('innerHTML'));
       }
     }));
     Y.Test.Runner.add(suite);
   });


Test Descriptors
****************

Intro
+++++

Test Descriptors are JSON configuration files that allow you to organize your tests into 
test suites.  You can also use test descriptors to control when and which tests execute 
at a given phase of your development cycle. 

Configurations
++++++++++++++

Test descriptors have configurations for describing, organizing, and factoring the tests. 
You can configure the base URL , group tests, pass parameters, and specify the page 
to test as well as the JavaScript test to run. 

The example test descriptor written to run the hello test we looked at earlier shows 
most of the important configurations. The name property allows you to describe your test, 
the config object allows you to specify the base URL, application name and path. The 
dataprovider object is where your tests are contained. Each test, such as “hello” below, 
can be grouped and be passed parameters. The params object below specifies the test and 
the page. Notice the annotations  

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "name" : "hello",
       "config" :{
         "baseUrl" : "http://localhost:8666",
         "application" : {
           "name":"hello",
           "path": "../../../examples/developer-guide/hello"
         }
       },
       "dataprovider" : {
         "hello" : {
           "group" : "developerguide,hello",
           "params" : {
             "test" : "test_hello.js",
             "page" : "$$config.baseUrl$$/"
           }
         }
       }
     }
   ]

Many of the configurations in the test descriptor files can be passed (and overridden) 
from the command line. For example, the baseUrl property in the config object can be 
specified on the command line: 
``$  arrow <some test or test descriptor> --baseUrl=http://some.base.url.com``


When to Create Test Descriptors
+++++++++++++++++++++++++++++++

Before creating test descriptors, we recommend executing each test with the Arrow 
command. Once you have a set of working tests, you should organize and factor 
the tests with a test descriptor. During test development, you’ll probably 
execute each test from the Arrow command line. However, once you have created 
tests to validate your module, you need a way to organize and factorize the tests.

Tests Based on Contexts
+++++++++++++++++++++++

You can also configure tests based on contexts, so you could run a set of tests 
for the development environment and run a different set of tests for the production 
environment.  The contexts in the text descriptors are like those in the configuration 
files for Mojito applications. In the example test descriptor below, you can see 
that given the context “environment:development”, the tests uses a different baseURL:

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "name" : "hello",
       "config" :{
         "baseUrl" : "http://localhost:8666",
         "application" : {
           "name":"hello",
           "path": "../../../examples/developer-guide/hello"
         }
       },
       "dataprovider" : {
         "hello" : {
           "group" : "developerguide,hello",
           "params" : {
             "test" : "test_hello.js",
             "page" : "$$config.baseUrl$$/"
           }
         }
       }
     },
     {
       "settings": [ "environment:development" ],
       "config" :{
         "baseUrl" : "http://my-test-env.com:800",
         "application" : {
           "name":"hello",
           "path": "../../../examples/developer-guide/hello"
         }
       }
     }
   ]

Running Arrow Command
+++++++++++++++++++++

Mojito comes with built-in unit and functional tests that we’re 
going to look at to illustrate how to use the Arrow command. 
The example tests and test descriptors are a great reference as well. 
Mojito also comes with the script run.js to simplify running the built-in 
Mojito tests. You can follow the instructions  in the Mojito documentation 
to run all of the tests or just a group of tests, which is highly recommended 
if you are going to contribute code to the Mojito project.

Setting Up
++++++++++

Before you do the following, make sure that you have installed Selenium.

#. Start Selenium: 

   ``$ java -jar path/to/selenium-server-standalone-<version>.jar &``
#. Clone Mojito: 

   ``$ git clone https://github.com/yahoo/mojito.git``
#. Change to the examples/developer-guide/hello directory and start the application.
#. In a new terminal window or tab, change to mojito/tests/func/examples/developerguide.

Single Tests
++++++++++++

#. In the developerguide directory, we’re going to first run the test directly with the 
Arrow command: ``$ arrow test_hello.js --page=http://localhost:8666``

#. You should see the following output:

::

    Passed DeveloperGuide: hello onMozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) 
    AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.43 Safari/537.31
    1 Passed, 0 Failed , 0 skipped 

Using Test Descriptors
++++++++++++++++++++++

We’re going to run the same test, but use the test descriptor to run it. 
Once again, from the ``developerguide`` directory and with the hello application 
and Selenium still running, run the following command:

``$ arrow hello_descriptor.json``

Creating the Application
========================

#. After you have copied the application that you made in the last module (see Setting Up), 
   change into the application ``06_testing``.
#. Let’s create mojits to fill out the dashboard.

   ::

      $ mojito create mojit blogMojit
      $ mojito create mojit calendarMojit
      $ mojito create mojit youtubeMojit
      $ mojito create mojit galleryMojit





Troubleshooting
===============

Problem One
-----------

Nulla pharetra aliquam neque sed tincidunt. Donec nisi eros, sagittis vitae lobortis nec, 
interdum sed ipsum. Quisque congue tempor odio, a volutpat eros hendrerit nec. Vestibulum 
ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae;

Problem Two
-----------

Nulla pharetra aliquam neque sed tincidunt. Donec nisi eros, sagittis vitae lobortis nec, 
interdum sed ipsum. Quisque congue tempor odio, a volutpat eros hendrerit nec. Vestibulum ante 
ipsum primis in faucibus orci luctus et ultriceposuere cubilia Curae;

Summary
=======

Q&A
===

Test Yourself
=============



Terms
=====

Source Code
===========

[app_part{x}](http://github.com/yahoo/mojito/examples/quickstart_guide/app_part{x})

Further Reading
===============

- [Mojito Doc](http://developer.yahoo.com/cocktails/mojito/docs/)





# Testing

## Running Framework Unit Tests

    $> mojito test

## Running Specific Unit Tests

For a test called `foo-test`, which is testing a module called `foo`:

    $> mojito test foo

or

    $> mojito test foo-test

As the name of the test, you can provide either the YUI module name of the test itself, or the class it is testing.

## Mojit Tests

In addition to running Mojito framework tests, you can also create unit tests for your mojits and execute them using the same command. Mojit tests must require (via YUI `require` block) the module under test. By default, Mojito uses the [YUITest](http://yuilibrary.com/yuitest/) framework for the test harness and assertion functions. Each mojit test will be executed within a pristine YUI instance along with its required dependencies, so you can be assured to only have properly scoped values.

### Standards

It is a good practice to create tests with proper names. For example, if you have a mojit controller that has a "common" affinity, it will look like this:

`controller.common.js`:

    YUI.add('Foo', function(Y) {
        ...
    });

A test for this will look like this:

`controller.common-tests.js`:

    YUI.add('Foo-tests`, function(Y) {
        ...
    }, 'VERSION', {requires: ['mojit-test', 'Foo']});

Your test file name and test YUI module must be named appropriately for the Mojito test harness to pick it up.

### Running Mojito Application Unit Tests

    $> mojito test app path/to/application

This command will run all tests found within a Mojito application for ever mojit within it.

### Types of Mojit Tests

You can write three types of unit tests to match the MVC components of a mojit:

#### Controller Tests

Each mojit has one controller, like this:

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

To test this controller, create a file in the `tests` directory called `controller.common-tests.js` (the `-tests` name specifies that this is a test, not a production module), and enter:

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

As you can see, we can get the refernce to the controller object directly from `Y.mojito.controller`.

#### Using the MockActionContext

As a convenience, the `mojito-test` YUI module includes a `MockActionContext` constructor that allows you to more easily build up an ActionContext for your controller tests and expect that certain things should occur on it. This mock ActionContext must be constructed and given information about what addons and models it should mock out. Below is an example of how to create a simple `MockActionContext` that mocks out the `done` function and verifies it was called correctly.

    var ac = new Y.mojito.MockActionContext();

    ac.expect({
        method: 'done',
        args: [YUITest.Mock.Value.Object],
        run: function(data) {
            YUITest.ObjectAssert.areEqual({ just: 'testing' });
        }
    });

    Y.mojito.controller.actionUnderTest(ac);

    ac.verify();

The code above will fail if the `actionUnderTest` function fails to call the `done` function, calls i more than one time, or calls it with the wrong parameters. For more information on the `expect` and `verify` functions, see the [YUITest Mock documentation](http://yuilibrary.com/yuitest/#mockobjects).

To mock out different addons, you specify the namespaces of the addons within the `MockActionContext` constructor:

    var ac = new Y.mojito.MockActionContext({
        addons: ['intl', 'assets']
    });

    ac.intl.expect({
        method: 'lang',
        args: ['UPDATING'],
        returns: 'updating, yo'
    });

You can also send many expectations into the same `expect` function:

    ac.assets.expect({
        method: 'preLoadImages',
        args: [YUITest.Mock.Value.Object],
        run: function(arr) {
            OA.areEqual(['thepath','thepath'], arr);
        },
        callCount: 1
    }, {
        method: 'getUrl',
        args: [YUITest.Mock.Value.String],
        returns: 'thepath',
        callCount: 3
    }, {
        method: 'addCss',
        args: ['thepath']
    });

Or, alternatively, chain the `expect` calls:

    ac.assets.expect({
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

You can mock out the ActionContext's models in the same manner as the addons:

    var ac = new Y.mojito.MockActionContext({
        addons: ['intl', 'params'],
        models: ['foo']
    });

    ac.models.foo.expect({
        method: 'getData',
        args: [YUITest.Mock.Value.Object, YUITest.Mock.Value.Function],
        run: function(prms, cb) {
            cb(null, {my: 'data'};
        }
    });

Sometimes, you might create a custom addon that contains functions within a property. For example, you might have an addon that is used like this:

    ac.customAddon.params.get('key');

To mock this, you can create a `MockActionContext` like this:

    var ac = new Y.mojito.MockActionContext({
        addons: ['customAddon'],
        extras: { customAddon: 'params'}
    });

This will give you a mock object at `ac.customAddon.params` that you can call `expect` on.

> Note: All mock `addons`, `models`, and `extras` will be be verified automatically when you call the main `verify function on the instance of `MockActionContext`.

#### Model Tests

Model tests are largely the same as controller tests, except there can be many of them. Model tests must be within the `tests/models` directory. You can create as many model tests here as you like. Here is an example given the following model:

    YUI.add('FooModel', function(Y, NAME) {

        Y.mojito.models.Foo = {

            getData: function(callback) {
                callback({some:'data'});
            }

        };

    }, '0.0.1', {requires: []});

And the test at `tests/models/model.common-tests.js`:

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


#### Binder Tests

You can also have many binder tests within the `tests/binders` directory. For example, if your binder is `index.js`:

    YUI.add('FooBinderIndex', function(Y, NAME) {

        Y.namespace('mojito.binders')[NAME] = {

            init: function(mojitProxy) {
                this.mojitProxy = mojitProxy;
            },

            bind: function(node) {
                this.node = node;
                var nodeId = node.get('id');
                var binderId = this.mojitProxy._guid;
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

You can write a binder tests in `tests/binders/index-common-tests.js`:

    YUI.add('FooBinderIndex-tests', function(Y, NAME) {

        var suite = new YUITest.TestSuite(NAME),
            binder,
            A = YUITest.Assert;

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

### Running Specific Mojito Application Unit Tests

This works just like running specific framework tests above, except for your application tests.

    $> mojito test app path/to/application [test-name]

This will run one specific test in your application, where `[test-name]` is either the YUI module of the test, or the module under test.

## Generating Framework Coverage Reports

>This has not been implemented.

    $> mojito test coverage

## Generate Mojit Coverage Reports

>This has not been implemented.

    $> mojito test app coverage

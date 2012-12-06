/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('mojito-models-addon', 'test', function(Y) {

    var suite = new Y.Test.Suite('mojito-models-addon tests'),
        A = Y.Assert;

    suite.add(new Y.Test.Case({

        name: 'model tests',

        'invalid model name': function () {
            var adapter = {};

            var addon = new Y.mojito.addons.ac.models({
                instance: {}
            }, adapter);

            var model = addon.get('foo');

            A.isUndefined(model, 'unregistered model should return undefined');
        },

        'valid model name': function () {
            var adapter = {};

            var addon = new Y.mojito.addons.ac.models({
                instance: {
                    config: 123
                }
            }, adapter);

            Y.mojito.models.foo = {
                init: function (c) {
                    A.areSame(123, c, 'init of the model should recieve the instance config');
                }
            };
            var model = addon.get('foo');
            A.isObject(model, 'registered model should return an instance');
        },

        'test instances of a model': function () {
            var adapter = {};

            var addon = new Y.mojito.addons.ac.models({
                instance: {}
            }, adapter);

            var initCounter = 0;
            Y.mojito.models.foo = {
                init: function (c) {
                    initCounter++;
                }
            };
            var model1 = addon.get('foo');
            A.isObject(model1, 'registered model should return an instance');
            var model2 = addon.get('foo');
            A.areSame(model1, model2, 'requesting an existing instance should return the refence');
            A.areSame(1, initCounter, 'init method should be called once');
        }

    }));

    suite.add(new Y.Test.Case({

        name: 'global model tests',

        'register global model in server with req object': function() {
            var serverAdapter = {
                req: {}
            };
            var bar = {
                init: function () {
                    A.fail('init of a global model should never be called, it is an instance already');
                }
            };

            // creating first addon instance
            var addon1 = new Y.mojito.addons.ac.models({
                instance: {}
            }, serverAdapter);
            addon1.registerGlobal('bar', bar);

            // creating second addon instance
            var addon2 = new Y.mojito.addons.ac.models({
                instance: {}
            }, serverAdapter);

            // testing models
            var model1 = addon1.get('bar');
            var model2 = addon2.get('bar');
            A.isObject(model1, 'registered global model should return an instance');
            A.areSame(bar, model1, 'should return the registered model');
            A.isObject(model2, 'registered global model by other mojit should return an instance');
            A.areSame(bar, model2, 'should return the registered model');
        },

        'register global model in client without req object': function() {
            var clientAdapter = {};
            var baz = {
                init: function () {
                    A.fail('init of a global model should never be called, it is an instance already');
                }
            };

            // creating first addon instance
            var addon1 = new Y.mojito.addons.ac.models({
                instance: {}
            }, clientAdapter);
            addon1.registerGlobal('baz', baz);

            // creating second addon instance
            var addon2 = new Y.mojito.addons.ac.models({
                instance: {}
            }, clientAdapter);

            // testing models
            var model1 = addon1.get('baz');
            var model2 = addon2.get('baz');
            A.isObject(model1, 'registered global model should return an instance');
            A.areSame(baz, model1, 'should return the registered model');
            A.isObject(model2, 'registered global model by other mojit should return an instance');
            A.areSame(baz, model2, 'should return the registered model');
        },

        'test global vs local': function() {
            var adapter = {};

            var addon = new Y.mojito.addons.ac.models({
                instance: {}
            }, adapter);

            var localModel = {
                name: 'local'
            };
            var globalModel = {
                name: 'global'
            };

            Y.mojito.models.cuba = localModel;
            addon.registerGlobal('cuba', globalModel);

            model = addon.get('cuba');
            A.isObject(model, 'registered model should return an instance');
            A.areSame(globalModel, model, 'global registered should have priority over local models');
        }

    }));

    Y.Test.Runner.add(suite);

});

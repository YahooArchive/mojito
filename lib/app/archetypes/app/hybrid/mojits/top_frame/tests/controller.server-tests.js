/*
 * Copyright (c) 2012 Yahoo! Inc. All rights reserved.
 */
/*jslint anon:true, sloppy:true, nomen:true*/
/*globals YUI, YUITest*/

YUI.add('top_frame-tests', function(Y) {

    var suite = new YUITest.TestSuite('top_frame-tests'),
        controller = null,
        A = YUITest.Assert;

    suite.add(new YUITest.TestCase({

        name: 'top_frame user tests',

        setUp: function() {
            controller = Y.mojito.controllers.top_frame;
        },
        tearDown: function() {
            controller = null;
        },

        'test mojit': function() {
            var ac,
                modelData,
                doneResults;
            modelData = { x: 'y' };
            ac = {
                models: {
                    get: function(modelName) {
                        A.areEqual('top_frameModelFoo', modelName, 'wrong model name');
                        return {
                            getData: function(cb) {
                                cb(null, modelData);
                            }
                        };
                    }
                },
                done: function(data) {
                    doneResults = data;
                }
            };

            A.isNotNull(controller);
            A.isFunction(controller.index);
            controller.index(ac);
            A.isObject(doneResults);
            A.areSame('Mojito is working.', doneResults.status);
            A.isObject(doneResults.data);
            A.isTrue(doneResults.data.hasOwnProperty('x'));
            A.areEqual('y', doneResults.data.x);

        }

    }));

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: ['mojito-test', 'top_frame']});

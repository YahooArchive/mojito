/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
 
/**
 * Creates the action context Mock
 * */
function getAC() {
    var ac = {
        http : {
            req : {
                carrier : {
                    get : function() {
                        this.getCalled = true;
                        return "uscingular";
                    }
                }
            },
            getRequest : function() {
                return this.req;
            }
        }
    };

    return ac;
}

/**
 * Creates the command Mock
 * */
function getCommand() {
    return {
        instance : {
            config :  {
            }
        }
    };
}

YUI.add('mojito-carrier-tests', function(Y, NAME) {

    var path = require('path'),
    suite = new YUITest.TestSuite(NAME),
    A = YUITest.Assert,
    OA = YUITest.ObjectAssert,
    Mock = YUITest.Mock;;

    suite.add(new YUITest.TestCase({

        name: 'carrier Add-on',

        setUp: function() {
        },
        tearDown: function() {
        },
        'Test add-on functions' : function () {

            var command = getCommand(),
            ac = getAC(),
            addon = new Y.mojito.addons.ac.carrier(command, {}, ac);

            A.isFunction(addon.get);
            A.isFunction(ac.carrier.get);
        },
        'Test add-on calls get function' : function () {
            var command = getCommand(),
            ac = getAC(),
            addon = new Y.mojito.addons.ac.carrier(command, {}, ac);

            A.areEqual("uscingular", ac.carrier.get("ticker"));
            A.isTrue(ac.http.req.carrier.getCalled);
        },
        'Test add-on is available if catalog is not available' : function () {
            var command = getCommand(),
            ac = getAC();

            // Overwrite the request with the empty object
            ac.http.req = {};
            var addon = new Y.mojito.addons.ac.carrier(command, {}, ac);

            A.isFunction(addon.get);
            A.isFunction(ac.carrier.get);
            A.areEqual(undefined, ac.carrier.get("ticker"));
        }
    }));

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: [
    'mojito-carrier-addon'
    ]});

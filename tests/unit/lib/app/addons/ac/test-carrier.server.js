/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
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

YUI().use('mojito-carrier-addon', 'test', function(Y) {

    var suite = new Y.Test.Suite('mojito-carrier tests'),
        cases = {},
        A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.Test.ObjectAssert;

    cases = {
        name: 'carrier Add-on',

        'test add-on functions' : function () {
            var command = getCommand(),
            ac = getAC(),
            addon = new Y.mojito.addons.ac.carrier(command, {}, ac);

            A.isFunction(addon.get);
            A.isFunction(ac.carrier.get);
        },
        'test add-on calls get function' : function () {
            var command = getCommand(),
            ac = getAC(),
            addon = new Y.mojito.addons.ac.carrier(command, {}, ac);

            A.areEqual("uscingular", ac.carrier.get('ticker'));
            A.isTrue(ac.http.req.carrier.getCalled);
        },
        'test add-on is available if catalog is not available' : function () {
            var command = getCommand(),
            ac = getAC();

            // Overwrite the request with the empty object
            ac.http.req = {};
            var addon = new Y.mojito.addons.ac.carrier(command, {}, ac);

            A.isFunction(addon.get);
            A.isFunction(ac.carrier.get);
            A.areEqual(undefined, ac.carrier.get('ticker'));
        }
    };

    suite.add(new Y.Test.Case(cases));
    Y.Test.Runner.add(suite);
});

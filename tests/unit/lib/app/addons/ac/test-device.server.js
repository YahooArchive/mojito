/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI().use('mojito-device-addon', 'test', function (Y) {

    /**
     * Creates the action context Mock
     * */
    function getAC() {
        var ac = {
            http : {
                req : {
                    device : {
                        get : function () {
                            this.getCalled = true;
                            return "iPhone";
                        }
                    }
                },
                getRequest : function () {
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

    var suite = new Y.Test.Suite('mojito-device-addon tests'),
        A = Y.Assert,
        OA = Y.ObjectAssert,
        Mock = Y.Mock;

    suite.add(new Y.Test.Case({

        name: 'device Add-on',

        setUp: function() {
        },
        tearDown: function() {
        },
        'test add-on functions' : function () {

            var command = getCommand(),
                ac = getAC(),
                addon = new Y.mojito.addons.ac.device(command, {}, ac);

            A.isFunction(addon.get);
            A.isFunction(ac.device.get);
        },
        'test add-on calls get function' : function () {
            var command = getCommand(),
                ac = getAC(),
                addon = new Y.mojito.addons.ac.device(command, {}, ac);

            A.areEqual("iPhone", ac.device.get("Make"));
            A.isTrue(ac.http.req.device.getCalled);
        },
        'test add-on is available if catalog is not available' : function () {
            var command = getCommand(),
                ac = getAC();

            // Overwrite the request with the empty object
            ac.http.req = {};
            var addon = new Y.mojito.addons.ac.device(command, {}, ac);

            A.isFunction(addon.get);
            A.isFunction(ac.device.get);
            A.areEqual(undefined, ac.device.get("Make"));
        }
    }));

    Y.Test.Runner.add(suite);

});
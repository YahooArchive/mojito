/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI().use('mojito-i13n-addon', 'test', function (Y) {
    /**
     * Creates the action context Mock
     * */
    function getAC() {
        var ac = {
            http : {
                req : {
                    i13n : {
                        ULT : {
                            ULT_PRECEDENCE_DEFAULT : 1
                        },
                        trackPageParams: function() {
                            this.trackparams = arguments;
                        },
                        stamp: {
                            stampPageView : function (sp) {
                                this.spaceid = sp;
                            }
                        },
                        trackLink : function () {
                            this.linkTracked = true;
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
                    i13n : {
                        "spaceid" : 123456,
                        "page" : {
                            "param1" : "value1"
                        }
                    }
                }
            }
        };
    }

    var suite = new Y.Test.Suite('mojito-i13n-addon tests'),
        A = Y.Assert,
        OA = Y.ObjectAssert,
        Mock = Y.Mock;

    suite.add(new Y.Test.Case({

        name: 'i13n Add-on',

        setUp: function () {
        },
        tearDown: function () {
        },
        'test add-on functions' : function () {

            var command = getCommand(),
                ac = getAC(),
                addon = new Y.mojito.addons.ac.i13n(command, {}, ac);

            A.isFunction(addon.make);
            A.isFunction(addon.trackLink);
            A.isFunction(addon.trackPageParams);

            A.isFunction(ac.i13n.make);
            A.isFunction(ac.i13n.trackLink);
            A.isFunction(ac.i13n.trackPageParams);
        },
        'test add-on calls stamp functions' : function () {
            var command = getCommand(),
                ac = getAC(),
                addon = new Y.mojito.addons.ac.i13n(command, {}, ac);

            A.areEqual(ac.http.req.i13n.stamp.spaceid, 123456);
            A.isTrue(ac.http.req.i13n.trackparams[0] === "param1");
        },

        'test Make function' : function () {
            var command = getCommand(),
                ac = getAC(),
                addon = new Y.mojito.addons.ac.i13n(command, {}, ac),
                uri = '/url',
                makeCalled = false;

            ac.url = {
                make : function () {
                    makeCalled = true;
                    return uri;
                }
            };

            ac.i13n.make(uri, {}, {}, "GET", {}, {"XYZ": "XXX"});
            A.isTrue(ac.http.req.i13n.linkTracked);
            A.isTrue(makeCalled);
        }
    }));

    Y.Test.Runner.add(suite);

});

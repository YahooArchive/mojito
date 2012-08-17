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
                i13n : {
                    ULT : {
                        ULT_PRECEDENCE_DEFAULT : 1
                    },
                    trackPageParams: function() {
                        this.trackparams = arguments;
                    },
                    stamp: {
                        stampPageView : function(sp) {
                            this.spaceid = sp;
                        }
                    },
                    trackLink : function() {
                        this.linkTracked = true;
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

YUI.add('mojito-i13n-tests', function(Y, NAME) {

    var path = require('path'),
    Addon = Y.mojito.addons.ac.i13n; //require(path.join(__dirname, '../../../../../app/addons/ac/yahoo/i13n.server.js')).constructor,
    suite = new YUITest.TestSuite(NAME),
    A = YUITest.Assert,
    OA = YUITest.ObjectAssert,
    Mock = YUITest.Mock;;

    suite.add(new YUITest.TestCase({

        name: 'i13n Add-on',

        setUp: function() {
        },
        tearDown: function() {
        },
        'Test add-on functions' : function () {

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
        'Test add-on calls stamp functions' : function () {
            var command = getCommand(),
            ac = getAC(),
            addon = new Y.mojito.addons.ac.i13n(command, {}, ac);

            A.areEqual(ac.http.req.i13n.stamp.spaceid, 123456);
            A.isTrue(ac.http.req.i13n.trackparams[0] === "param1");
        },

        'Test Make function' : function() {
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
            }

            ac.i13n.make(uri, {}, {}, "GET", {}, {"XYZ": "XXX"});
            A.isTrue(ac.http.req.i13n.linkTracked);
            A.isTrue(makeCalled);
        },

        'TODO Test stampPageView function' : function() {

            A.skip();
        },

        'TODO Test trackUserLink function' : function() {

            A.skip();
        },

        'TODO Test trackForm function' : function() {

            A.skip();
        },

        'TODO Test trackClickOnly function' : function() {

            A.skip();
        },

        'TODO Test getSpaceid function' : function() {

            A.skip();
        }
    }));

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: [
    'mojito-i13n-addon'
]});

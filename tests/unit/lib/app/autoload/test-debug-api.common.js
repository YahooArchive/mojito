/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('mojito-debug-api', 'test', function(Y) {
    var suite = new YUITest.TestSuite('mojito-debug-api-tests'),
        A = YUITest.Assert,
        OA = YUITest.ObjectAssert,
        AA = YUITest.ArrayAssert;

    suite.add(new YUITest.TestCase({
        name: 'Debug api',

        'debug interface off': function() {
            var req = {
                    query: {
                    }
                },
                debug = new Y.mojito.DebugAPI(Y, req, "debug", null);

            debug.on("bar", function(d) {
                d.data = "abc";
            });
            debug.log("here");
            debug.logOn("My", "there");
            debug.profOpen("A", "b", "b desc");
            debug.profClose("A", "b", "first close");
            debug.profEvent("A", "event 1");

            // AA.contains(debug.flags(), [], 'correct flags');
            A.areEqual(0, debug.flags().length, 'no flags');
            A.isUndefined(debug.get("bar"), "no bar data");
            A.isUndefined(debug.get("log"), "no log data");
            A.isUndefined(debug.get("log.My"), "no log.My data");
            A.isUndefined(debug.get("prof.A"), "cno prof.A");
            A.isFalse(debug.flag("bar"), "flag not set");
        },

        'debug on flags off': function() {
            var req = {
                    query: {
                        debug: "help"
                    }
                },
                debug = new Y.mojito.DebugAPI(Y, req, "debug", null);

            debug.on("bar", function(d) {
                d.data = "abc";
            });
            debug.log("here");
            debug.logOn("My", "there");
            debug.profOpen("A", "b", "b desc");
            debug.profClose("A", "b", "first close");
            debug.profEvent("A", "event 1");

            AA.containsItems("help".split(/,/), debug.flags(), 'correct flags');
            // A.areEqual(debug.flags().length, 0, 'no flags');
            A.isUndefined(debug.get("bar"), "no bar data");
            A.isUndefined(debug.get("log"), "no log data");
            A.isUndefined(debug.get("log.My"), "no log.My data");
            A.isUndefined(debug.get("prof.A"), "cno prof.A");
            A.isFalse(debug.flag("bar"), "flag not set");
        },

        'debug interface on': function() {
            var req = {
                    query: {
                        debug: "bar,log,log.My,prof.A"
                    }
                },
                debug = new Y.mojito.DebugAPI(Y, req, "debug", null);

            debug.on("bar", function(d) {
                d.data = "abc";
            });
            debug.log("here");
            debug.logOn("My", "there");
            debug.profOpen("A", "b", "b desc");
            debug.profClose("A", "b", "first close");
            debug.profEvent("A", "event 1");

            AA.containsItems("bar,log,log.My,prof.A".split(/,/), debug.flags(), 'correct flags');
            A.areEqual("abc", debug.get("bar").data, "correct bar data");
            A.areEqual(1, debug.get("log").data.length, "correct log data count");
            OA.areEqual({content: "here", jsonTreeOptions: undefined}, debug.get("log").data[0], "correct log data");
            A.areEqual(1, debug.get("log.My").data.length, "correct log.My data count");
            OA.areEqual({content: "there", jsonTreeOptions: undefined}, debug.get("log.My").data[0], "correct log.My data");
            // do prof data
            A.areEqual(1, Y.Object.keys(debug.get("prof.A").data).length, "correct prof.A data count");
            A.isNotUndefined(debug.get("prof.A").data['b'], "correct prof.A node data");
            A.areEqual('b desc', debug.get("prof.A").data['b'].desc, "correct prof.A desc");
            A.isNumber(debug.get("prof.A").data['b'].start, "correct prof.A start");
            A.areEqual(1, debug.get("prof.A").data['b'].close.length, "correct prof.A.close data count");
            A.areEqual('first close', debug.get("prof.A").data['b'].close[0].type, "correct prof.A.close type");
            A.isNumber(debug.get("prof.A").data['b'].close[0].time, "correct prof.A.close time");
            A.areEqual(1, debug.get("prof.A").events.length, "correct prof.A.events count");
            A.areEqual('event 1', debug.get("prof.A").events[0].type, "correct prof.A.events type");
            A.isNumber(debug.get("prof.A").events[0].time, "correct prof.A.events time");

            AA.containsItems("My".split(/,/), debug.getSpecialLogs(), 'correct flags');
            AA.containsItems("A".split(/,/), debug.getKnownProf(), 'correct flags');
            A.isTrue(debug.flag("bar"), "flag set");
        },

        'debug interface more data': function() {
            var req = {
                    query: {
                        debug: "log,log.My,prof.A"
                    }
                },
                debug = new Y.mojito.DebugAPI(Y, req, "debug", null);

            debug.log("here");
            debug.log("here2");
            debug.logOn("My", "there");
            debug.logOn("My", "there2");
            debug.profOpen("A", "b", "b desc");
            debug.profClose("A", "b", "first close");
            debug.profClose("A", "b", "second close");
            debug.profEvent("A", "event 1");
            debug.profEvent("A", "event 2");
            debug.profOpen("A", "c", "c desc");
            debug.profClose("A", "c", "first close");
            debug.profClose("A", "c", "second close");

            debug.profClose("A", "d", "close no open");

            AA.containsItems("log,log.My,prof.A".split(/,/), debug.flags(), 'correct flags');
            A.areEqual(2, debug.get("log").data.length, "correct log data count");
            OA.areEqual({content: "here", jsonTreeOptions: undefined}, debug.get("log").data[0], "correct log data");
            OA.areEqual({content: "here2", jsonTreeOptions: undefined}, debug.get("log").data[1], "correct log data");
            A.areEqual(2, debug.get("log.My").data.length, "correct log.My data count");
            OA.areEqual({content: "there", jsonTreeOptions: undefined}, debug.get("log.My").data[0], "correct log.My data");
            OA.areEqual({content: "there2", jsonTreeOptions: undefined}, debug.get("log.My").data[1], "correct log.My data");
            // do prof data
            A.areEqual(2, Y.Object.keys(debug.get("prof.A").data).length, "correct prof.A data count");
            A.isNotUndefined(debug.get("prof.A").data['b'], "correct prof.A node b data");
            A.areEqual('b desc', debug.get("prof.A").data['b'].desc, "correct prof.A b desc");
            A.isNumber(debug.get("prof.A").data['b'].start, "correct prof.A b start");
            A.areEqual(2, debug.get("prof.A").data['b'].close.length, "correct prof.A.close b data count");
            A.areEqual('first close', debug.get("prof.A").data['b'].close[0].type, "correct prof.A.close b.0 type");
            A.isNumber(debug.get("prof.A").data['b'].close[0].time, "correct prof.A.close b.0 time");
            A.areEqual('second close', debug.get("prof.A").data['b'].close[1].type, "correct prof.A.close b.1 type");
            A.isNumber(debug.get("prof.A").data['b'].close[1].time, "correct prof.A.close b.1 time");

            A.areEqual(2, debug.get("prof.A").events.length, "correct prof.A.events count");
            A.areEqual('event 1', debug.get("prof.A").events[0].type, "correct prof.A.events type");
            A.isNumber(debug.get("prof.A").events[0].time, "correct prof.A.events time");
            A.areEqual('event 2', debug.get("prof.A").events[1].type, "correct prof.A.events type");
            A.isNumber(debug.get("prof.A").events[1].time, "correct prof.A.events time");

            A.isNotUndefined(debug.get("prof.A").data['c'], "correct prof.A node c data");
            A.areEqual('c desc', debug.get("prof.A").data['c'].desc, "correct prof.A c desc");
            A.isNumber(debug.get("prof.A").data['c'].start, "correct prof.A c start");
            A.areEqual(2, debug.get("prof.A").data['c'].close.length, "correct prof.A.close c data count");
            A.areEqual('first close', debug.get("prof.A").data['c'].close[0].type, "correct prof.A.c.0 close type");
            A.isNumber(debug.get("prof.A").data['c'].close[0].time, "correct prof.A.close c.0 time");
            A.areEqual('second close', debug.get("prof.A").data['c'].close[1].type, "correct prof.A.c.1 close type");
            A.isNumber(debug.get("prof.A").data['c'].close[1].time, "correct prof.A.close c.1 time");

            AA.containsItems("My".split(/,/), debug.getSpecialLogs(), 'correct flags');
            AA.containsItems("A".split(/,/), debug.getKnownProf(), 'correct flags');
        },

        'instrimentatin errors': function() {
            var req = {
                    query: {
                        debug: "bar,log.My"
                    }
                },
                debug = new Y.mojito.DebugAPI(Y, req, "debug", null);

            debug.on("bar", function(d) {
                throw new Error("fail 1");
            });
            debug.logOn("My", function () {throw new Error("fail 2");});

            AA.containsItems("bar,log.My".split(/,/), debug.flags(), 'correct flags');
            A.isNotUndefined(debug.getInstrumentationErrors(), "error list");
            A.areEqual(2, debug.getInstrumentationErrors().length, 'number of errors');
            A.areEqual('bar', debug.getInstrumentationErrors()[0].flag, 'bar error');
            A.areEqual('log.My', debug.getInstrumentationErrors()[1].flag, 'log.My error');
        },
    }));

    YUITest.TestRunner.add(suite);
});

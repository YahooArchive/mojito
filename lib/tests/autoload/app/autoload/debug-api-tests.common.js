/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-debug-api-tests', function(Y, NAME) {
    var suite = new YUITest.TestSuite(NAME),
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
            A.areEqual(debug.flags().length, 0, 'no flags');
            A.isUndefined(debug.get("bar"), "no bar data");
            A.isUndefined(debug.get("log"), "no log data");
            A.isUndefined(debug.get("log.My"), "no log.My data");
            A.isUndefined(debug.get("prof.A"), "cno prof.A");
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

            AA.containsItems(debug.flags(), "help".split(/,/), 'correct flags');
            // A.areEqual(debug.flags().length, 0, 'no flags');
            A.isUndefined(debug.get("bar"), "no bar data");
            A.isUndefined(debug.get("log"), "no log data");
            A.isUndefined(debug.get("log.My"), "no log.My data");
            A.isUndefined(debug.get("prof.A"), "cno prof.A");
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

            AA.containsItems(debug.flags(), "bar,log,log.My,prof.A".split(/,/), 'correct flags');
            A.areEqual(debug.get("bar").data, "abc", "correct bar data");
            A.areEqual(debug.get("log").data.length, 1, "correct log data count");
            OA.areEqual(debug.get("log").data[0], {content: "here", jsonTreeOptions: undefined}, "correct log data");
            A.areEqual(debug.get("log.My").data.length, 1, "correct log.My data count");
            OA.areEqual(debug.get("log.My").data[0], {content: "there", jsonTreeOptions: undefined}, "correct log.My data");
            // do prof data
            A.areEqual(Y.Object.keys(debug.get("prof.A").data).length, 1, "correct prof.A data count");
            A.isNotUndefined(debug.get("prof.A").data['b'], "correct prof.A node data");
            A.areEqual(debug.get("prof.A").data['b'].desc, 'b desc', "correct prof.A desc");
            A.isNumber(debug.get("prof.A").data['b'].start, "correct prof.A start");
            A.areEqual(debug.get("prof.A").data['b'].close.length, 1, "correct prof.A.close data count");
            A.areEqual(debug.get("prof.A").data['b'].close[0].type, 'first close', "correct prof.A.close type");
            A.isNumber(debug.get("prof.A").data['b'].close[0].time, "correct prof.A.close time");
            A.areEqual(debug.get("prof.A").events.length, 1, "correct prof.A.events count");
            A.areEqual(debug.get("prof.A").events[0].type, 'event 1', "correct prof.A.events type");
            A.isNumber(debug.get("prof.A").events[0].time, "correct prof.A.events time");

            AA.containsItems(debug.getSpecialLogs(), "My".split(/,/), 'correct flags');
            AA.containsItems(debug.getKnownProf(), "A".split(/,/), 'correct flags');
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

            AA.containsItems(debug.flags(), "log,log.My,prof.A".split(/,/), 'correct flags');
            A.areEqual(debug.get("log").data.length, 2, "correct log data count");
            OA.areEqual(debug.get("log").data[0], {content: "here", jsonTreeOptions: undefined}, "correct log data");
            OA.areEqual(debug.get("log").data[1], {content: "here2", jsonTreeOptions: undefined}, "correct log data");
            A.areEqual(debug.get("log.My").data.length, 2, "correct log.My data count");
            OA.areEqual(debug.get("log.My").data[0], {content: "there", jsonTreeOptions: undefined}, "correct log.My data");
            OA.areEqual(debug.get("log.My").data[1], {content: "there2", jsonTreeOptions: undefined}, "correct log.My data");
            // do prof data
            A.areEqual(Y.Object.keys(debug.get("prof.A").data).length, 2, "correct prof.A data count");
            A.isNotUndefined(debug.get("prof.A").data['b'], "correct prof.A node b data");
            A.areEqual(debug.get("prof.A").data['b'].desc, 'b desc', "correct prof.A b desc");
            A.isNumber(debug.get("prof.A").data['b'].start, "correct prof.A b start");
            A.areEqual(debug.get("prof.A").data['b'].close.length, 2, "correct prof.A.close b data count");
            A.areEqual(debug.get("prof.A").data['b'].close[0].type, 'first close', "correct prof.A.close b.0 type");
            A.isNumber(debug.get("prof.A").data['b'].close[0].time, "correct prof.A.close b.0 time");
            A.areEqual(debug.get("prof.A").data['b'].close[1].type, 'second close', "correct prof.A.close b.1 type");
            A.isNumber(debug.get("prof.A").data['b'].close[1].time, "correct prof.A.close b.1 time");

            A.areEqual(debug.get("prof.A").events.length, 2, "correct prof.A.events count");
            A.areEqual(debug.get("prof.A").events[0].type, 'event 1', "correct prof.A.events type");
            A.isNumber(debug.get("prof.A").events[0].time, "correct prof.A.events time");
            A.areEqual(debug.get("prof.A").events[1].type, 'event 2', "correct prof.A.events type");
            A.isNumber(debug.get("prof.A").events[1].time, "correct prof.A.events time");

            A.isNotUndefined(debug.get("prof.A").data['c'], "correct prof.A node c data");
            A.areEqual(debug.get("prof.A").data['c'].desc, 'c desc', "correct prof.A c desc");
            A.isNumber(debug.get("prof.A").data['c'].start, "correct prof.A c start");
            A.areEqual(debug.get("prof.A").data['c'].close.length, 2, "correct prof.A.close c data count");
            A.areEqual(debug.get("prof.A").data['c'].close[0].type, 'first close', "correct prof.A.c.0 close type");
            A.isNumber(debug.get("prof.A").data['c'].close[0].time, "correct prof.A.close c.0 time");
            A.areEqual(debug.get("prof.A").data['c'].close[1].type, 'second close', "correct prof.A.c.1 close type");
            A.isNumber(debug.get("prof.A").data['c'].close[1].time, "correct prof.A.close c.1 time");

            AA.containsItems(debug.getSpecialLogs(), "My".split(/,/), 'correct flags');
            AA.containsItems(debug.getKnownProf(), "A".split(/,/), 'correct flags');
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

            AA.containsItems(debug.flags(), "bar,log.My".split(/,/), 'correct flags');
            A.isNotUndefined(debug.getInstrumentationErrors(), "error list");
            A.areEqual(debug.getInstrumentationErrors().length, 2, 'number of errors');
            A.areEqual(debug.getInstrumentationErrors()[0].flag, 'bar', 'bar error');
            A.areEqual(debug.getInstrumentationErrors()[1].flag, 'log.My', 'log.My error');
        },
    }));

    YUITest.TestRunner.add(suite);
}, '0.0.1', {requires: ['mojito-debug-api']});

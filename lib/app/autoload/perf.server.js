/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/
YUI.add('mojito-perf', function (Y, NAME) {

    if (!YUI._mojito) {
        YUI._mojito = {};
    }


    var store = YUI._mojito._perf,
        perfConfig = Y.config.perf || {},
        requestId = 0,
        colorRed   = '\u001b[31m',
        colorReset = '\u001b[0m',
        getgo,
        microtime;


    try {
        microtime = require('microtime');
    } catch (e) {
        Y.log('microtime not found. Recorded times will not have' +
            ' microsecond accuracy', 'warn', NAME);
    }


    function print(group, label) {
        var o = store[group][label],
            // if we already have milliseconds, good
            // if not, we can compute it based on request init
            ms = o.ms || (o.time - getgo);

        Y.log(group + ':' + label + ' ' + colorRed +
            (o.ms ? 'timeline=' : 'mark=') + ms +
            colorReset + ' (' + (o.msg || 'no desc') + ')',
            'mojito', NAME);

    }


    //internal. abstracts where timestamps come from
    function timestamp() {
        return microtime ? microtime.now() : new Date().getTime();
    }


    function mark(group, label, msg, id) {
        var s;

        if (!group || !label) {
            return;
        }

        if (id) {
            label += '[' + id + ']';
        }

        if (!store[group]) {
            store[group] = {};
        }

        if (!msg) {
            msg = '';
        }

        if (store[group][label]) {
            Y.log('Perf metric collision for group=' + group + ' label=' + label +
                '. Measure one thing at a time.', 'warn', NAME);
        }

        s = store[group][label] = {};
        s.msg = msg;
        s.time = timestamp();
        return s;
    }


    function timeline(group, label, message, id) {
        var t = timestamp();
        return {
            done: function () {
                var s = mark(group, label, message, id);
                // augmenting the default format
                s.ms = timestamp() - t;
            }
        };
    }


    function dump() {

        var group,
            label;

        for (group in store) {
            if (store.hasOwnProperty(group)) {
                for (label in store[group]) {
                    if (store[group].hasOwnProperty(label)) {
                        print(group, label);
                    }
                }
                delete store[group];
            }
        }
    }


    function instrumentMojitoRequest(req, res) {
        var id = (requestId += 1),
            perf,
            end = res.end;

        getgo = timestamp();
        if (Y.Object.keys(store).length > 0) {
            Y.log('Multiple requests at the same time. This can ' +
                    'mess with the perf analysis. Curl is your best ' +
                    'friend, use it.', 'warn', NAME);
        }

        perf = timeline('mojito', NAME + ':express:timeline', 'time to respond', id);

        // hooking into the res.end called from output-handler.server.js
        // to be able to flush perf metrics only for mojito requests.
        // static requests and other type of requests will be ignored.
        res.end = function () {
            if (perf) {
                end.apply(res, arguments);
                Y.log('Flushing perf metrics', 'mojito', NAME);
                perf.done();
                dump();
                // some cleanup
                perf = null;
                end = null;
                req = null;
                res = null;
            }
        };
    }


    Y.namespace('mojito').perf = {

        instrumentMojitoRequest: perfConfig ? instrumentMojitoRequest : function () {},

        timeline: perfConfig.timeline ? timeline : function () {
            return {
                done: function () {}
            };
        },

        mark: perfConfig.mark ? mark : function () {},

        dump: perfConfig ? dump : function () {}
    };

    if (!store) {
        store = YUI._mojito._perf = {};
    }

});

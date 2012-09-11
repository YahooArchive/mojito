/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/
YUI.add('mojito-perf', function (Y, NAME) {

    /**
     * @module mojito-perf
     * @class mojito.perf
     * @static
     */

    if (!YUI._mojito) {
        YUI._mojito = {};
    }


    var buffer     = YUI._mojito._perf,
        perfConfig = Y.config.perf || {},
        requestId  = 0,
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
        var o = buffer[group][label],
            // if we already have milliseconds, good
            // if not, we can compute it based on request init
            ms = o.ms || (o.time - getgo);

        if ((perfConfig.mark && !o.ms) || (perfConfig.timeline && o.ms)) {

            Y.log(group + ':' + label + ' ' + colorRed +
                (o.ms ? 'timeline=' : 'mark=') + ms +
                colorReset + ' (' + (o.msg || 'no desc') + ')',
                'mojito', NAME);

        }

    }


    //internal. abstracts where timestamps come from
    function timestamp() {
        return microtime ? microtime.now() : new Date().getTime();
    }


    /**
     * Sets a mark in the request timeline. All marks will be flushed
     * after the end. This is useful to measure when a particular process
     * start or end with respect to the request timeline.
     *
     * @method mark
     * @param {string} group Event group.
     * @param {string} label Event identifier. Will be combined with group.
     * @param {string} msg Description of the mark.
     * @param {string} id Unique identifier of the mark, usually
     *      the requestId or the yuid().
     * @return {Object} The mark entry.
     **/
    function mark(group, label, msg, id) {
        var s;

        if (!group || !label) {
            return;
        }

        if (id) {
            label += '[' + id + ']';
        }

        if (!buffer[group]) {
            buffer[group] = {};
        }

        if (!msg) {
            msg = '';
        }

        if (buffer[group][label]) {
            Y.log('Perf metric collision for group=' + group + ' label=' + label +
                '. Measure one thing at a time.', 'warn', NAME);
            label += Y.guid();
        }

        s = buffer[group][label] = {};
        s.msg = msg;
        s.time = timestamp();
        return s;
    }


    /**
     * Starts a timeline metric, providing a way to call it done
     * at some point in the future. This is useful to measure the
     * time to execute a process in mojito.
     *
     * @method timeline
     * @param {string} group Event group.
     * @param {string} label Event identifier. Will be combined with group.
     * @param {string} msg Description of the mark.
     * @param {string} id Unique identifier of the mark, usually
     *      the requestId or the yuid().
     * @return {object} represents the timeline object that has a method
     *      called "done" that can be invoked when the process finish.
     **/
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


    /**
     * Dumps all marks and timeline entries into the console.
     * This method is meant to be called automatically when
     * a request ends. You can target specific metrics by using
     * the configuration:
     *
     * "perf": {
     *    "include": {
     *        "mojito-action-context": true
     *    }
     * }
     *
     * Or just exclude some of them by doing:
     *
     * "perf": {
     *    "exclude": {
     *        "mojito-action-context": true
     *    }
     * }
     *
     *
     * @method dump
     **/
    function dump() {

        var group,
            label;

        for (group in buffer) {
            if ((buffer.hasOwnProperty(group)) &&
                (!perfConfig.exclude || !perfConfig.exclude[group]) &&
                (!perfConfig.include || perfConfig.include[group])) {
                for (label in buffer[group]) {
                    if (buffer[group].hasOwnProperty(label)) {
                        print(group, label);
                    }
                }
                delete buffer[group];
            }
        }
    }


    /**
     * Instruments requests that will be processed by mojito
     * core, providing a valid timeline for that request, and
     * allowing to instrument some other relative processes,
     * and grouping them per request to facilitate analysis.
     * This method is responsible for calling "dump".
     *
     * @method instrumentMojitoRequest
     * @param {object} req the request object from express.
     * @param {object} res the response object from express.
     **/
    function instrumentMojitoRequest(req, res) {
        var id = (requestId += 1),
            perf,
            end = res.end;

        getgo = timestamp();
        if (Y.Object.keys(buffer).length > 0) {
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

    if (!buffer) {
        buffer = YUI._mojito._perf = {};
    }

});

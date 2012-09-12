/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI,require,process*/
YUI.add('mojito-perf', function (Y, NAME) {

    /**
     * @module mojito-perf
     * @class mojito.perf
     * @static
     */

    if (!YUI._mojito) {
        YUI._mojito = {};
    }


    var libfs = require('fs'),
        libpath = require('path'),
        existsSync = libfs.existsSync || libpath.existsSync,
        buffer     = YUI._mojito._perf,
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


    //internal. write perf info into a file
    function writeLog(filename, logs) {
        var outstream,
            i;

        try {
            outstream = libfs.createWriteStream(filename, {
                flags: 'a' // append
            });
            for (i = 0; i < logs.length; i += 1) {
                outstream.write(logs[i].join('|') + "\n");
            }
            outstream.end();
            outstream = null;
        } catch (err) {
            Y.log('Error trying to dump perf metrics in file: ' +
                filename + ' Error:' + err, 'error', NAME);
        }
    }


    //internal. print perf info in the logs
    function print(group, key) {
        var o = buffer[group][key],
            type = (o.ms ? 'TIMELINE' : 'MARK'),
            // if we already have milliseconds, good
            // if not, we can compute it based on request init
            time = o.time,
            offset = o.time - getgo,
            duration = o.ms || '',
            desc = o.msg || 'no description',
            label = o.label,
            id = o.id;

        if ((perfConfig.mark && !o.ms) || (perfConfig.timeline && o.ms)) {

            Y.log(group + ':' + key + ' ' + type + colorReset +
                ' offset=' + colorRed + offset + colorReset +
                (o.ms ? ' duration=' + colorRed + duration + colorReset : '') +
                ' (' + desc + ')',
                'mojito', NAME);

            return [type, requestId, time, duration, group, label, id, desc];

        }

    }


    //internal. abstracts where timestamps come from
    function timestamp() {
        return microtime ? microtime.now() : new Date().getTime();
    }


    /**
     * Produces an ID to identify the timeline or mark based on a
     * command object.
     *
     * @method idFromCommand
     * @param {object} command Object that represent the command to invoke.
     * @return {string} ID that represents the command.
     **/
    function idFromCommand(command) {
        var str;
        if (command && command.instance) {
            if (command.instance.id) {
                str = command.instance.id;
            } else if (command.instance.base) {
                str = '+' + command.instance.base;
            } else {
                str = '@' + command.instance.type;
            }
            str += '.' + (command.action || command.instance.action || '???');
        }
        return str;
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
     * @param {string|object} id Unique identifier of the mark, usually
     *      the requestId or a command object.
     * @return {Object} The mark entry.
     **/
    function mark(group, label, msg, id) {
        var s,
            key = label;

        if (!group || !label) {
            return;
        }

        if (id) {
            // we might also accept a command object
            id = Y.Lang.isObject(id) ? idFromCommand(id) : id;
            key += '[' + id + ']';
        }

        if (!buffer[group]) {
            buffer[group] = {};
        }

        if (!msg) {
            msg = '';
        }

        if (buffer[group][key]) {
            Y.log('Perf metric collision for group=' + group +
                ' label=' + label + ' id=' + id +
                '. Measure one thing at a time.', 'warn', NAME);
            key += Y.guid();
        }

        s = buffer[group][key] = {};
        s.msg = msg;
        s.label = label;
        s.id = id;
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
    function timeline(group, label, msg, id) {
        var t = timestamp();
        return {
            done: function () {
                var s = mark(group, label, msg, id);
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
     * @return {array} collection of perf logs. Each item will expose:
     *     {type, requestId, time, duration, group, label, id, desc}
     **/
    function dump() {

        var group,
            key,
            entry,
            logs = [];

        for (group in buffer) {
            if ((buffer.hasOwnProperty(group)) &&
                    (!perfConfig.exclude || !perfConfig.exclude[group]) &&
                    (!perfConfig.include || perfConfig.include[group])) {
                for (key in buffer[group]) {
                    if (buffer[group].hasOwnProperty(key)) {
                        entry = print(group, key);
                        if (entry) {
                            logs.push(entry);
                        }
                    }
                }
                delete buffer[group];
            }
        }
        // dumping to disk
        if (perfConfig.logFile) {
            Y.log('Dumping performance metrics into disk: ' +
                perfConfig.logFile, 'mojito', NAME);
            writeLog(perfConfig.logFile, logs);
        }

        return logs;
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

        perf = timeline('mojito', 'request', 'the whole request', id);

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

        idFromCommand: perfConfig ? idFromCommand : function () {},

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

    if (perfConfig.logFile && existsSync(perfConfig.logFile)) {
        Y.log("Removing the previous perf log file '" +
            perfConfig.logFile + "'", 'warn', NAME);
        libfs.unlinkSync(perfConfig.logFile);
    }

});

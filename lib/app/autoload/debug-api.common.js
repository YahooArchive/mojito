/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, regexp: true, nomen:true*/
/*global YUI*/


/**
 * To use the debugger interface, users my include a debug section into there application.json file
 *
 * Example:
 * <pre>
 *   [
 *       {
 *           "settings": [ "master" ],
 *           "specs": {
 *                 ...
 *           },
 *           "debug": {
 *               "queryParam": "my_debug",             (required)
 *               "debugMojit": "@DebugFrame.index",    (required)
 *               "debugPath": "/debug_path",           (required)
 *               "modules": {                          (optional)
 *               },
 *               "debugAllowed": "mojito-debug-reqest-validate.handler"  (optional)
 *           }
 * </pre>
 *
 * <ul>
 * <li>queryParam : A query param that provides a list of debug flags to turn on. Example: ?my_debug=help</li>
 * <li>debugMojit : Name of mojit to redirect request to. Example: @DebugFrame.index</li>
 * <li>debugPath : Name of a path that is NOT used by the application. This path will be used internal to redirect
 *             the request. This needs to not conflict with any other path the application uses.</li>
 * <li>modules: A list of debug and flag and modules to use for user defined debug data.<P>
 *   Example:
 * <pre>
                "bar": {
                    "title": "Bar",
                    "description": "Test debug of Bar",
                    "type": "DebugBar"
                }
 * </pre>
 *   The DebugBar mojit will be used to render all data collected using the debug.on API calls.
 *   To acess the debug data use the the debug.get({flag}) call.
 *   The flag is bar.</li>
 * <li>debugAllowed: This is the name of a YUI module and a function inside it (module_name.function). This function
 *               is of the format function (req). It should return true of false if this request is by a valid
 *               user of the debugging system. Invalid request will return error. Valid request will redirect
 *               to the debugMojit.</li>
 * </ul>
 *
 * To generate the UI for the debug system, you can use the mojito-debug-view NPM module, or write your own.
 * @module MojitoDebug
 */
YUI.add('mojito-debug-api', function(Y, NAME) {
    /**
     * Interface to add debugging data to a request. This api is available from three sources:
     * <ol>
     * <li>The request object: req.debug</li>
     * <li>The adapter object: adapter.debug</li>
     * <li>If using the mojito-debug-view NPM module, there is an ac addon ('mojito.debug.api') that provides the api though the ac: ac.debug</li>
     * </ol>
     * @class MojitoDebugAPI
     * @constructor
     * @param {Object} Y
     * @param {String} queryparam Query param of comma seperated list of debug flags to enable
     * @param {Object} microtime microtime interface to use if possible
     */
    function DebugAPI(Y, req, queryParam, microtime) {
        var store = {};
        store.modules = {};
        store.profile = {};
        store.specialLogs = {};

        this.Y = Y;
        this.store = store;
        this.microtime = microtime;

        if (queryParam && req.query && req.query[queryParam]) {

            Y.each(this.parseDebugParameters(req.query[queryParam]), function (flag) {
                store.modules[flag] = {};
            });

            /**
             * Check to see if a specific debug flag is set.
             * @method flag
             * @param {String} flag Flag to check
             * @return {boolean}
             */
            this.flag = function (flag) {
                if (store.modules[flag]) {
                    return true;
                }
                return false;
            };

            /**
             * If flat is set, call provided function with handle to object to store debug data in. Viewable with /?my_debug={flag,...}
             * @method on
             * @param {String} flag Flag to check
             * @param {Function} cb Funcion of the form function (data) {} where data will be per flag object to store debug data in.
             *
             * Example:
             * <pre>
             * debug.on("my_debug_flag", function (my_debug_data) {
             *     my_debug_data.something = 'some data';
             * }
             * </pre>
             */
            this.on = function (flag, f) {

                if (store.modules[flag]) {
                    // catch any errors in instrumented code
                    try {
                        f(store.modules[flag]);
                    } catch (e) {
                        if (!store.instrumentationErrors) {
                            store.instrumentationErrors = [];
                        }
                        store.instrumentationErrors.push({flag: flag, error: e});
                    }
                }
            };

            /**
             * Log a string or an object to the generic debug log stream. Viewable with /?my_debug=log
             * @method log
             * @param {Object} content A string or an object to log. May also be a function, that when called returns a string or object.
             * @param {Object} jsonTreeOptions An optional object for hints to displaying object. Valid values: depth
             *
             * Example:
             * <pre>
             * debug.log("Some log data");
             * debug.log({some: 'data'});
             * debug.log(function () {return "log data";});
             * </pre>
             */
            this.log = function (content, jsonTreeOptions) {
                this.logOn("", content, jsonTreeOptions);
            };

            /**
             * Log a string or an object to the a specific log stream. Viewable with /?my_debug=Log.{logType}
             * @method logOn
             * @param {String} logType Name of log stream to log to
             * @param {String} content A string or an object to log. May also be a function, that when called returns a string or object.
             * @param {Object} jsonTreeOptions An optional object for hints to displaying object. Valid values: depth
             *
             * Example:
             * <pre>
             * debug.logOn("MyLogs", "Some log data");
             * debug.logOn("MyLogs", {some: 'data'});
             * debug.logOn("MyLogs", function () {return "log data";});
             * </pre>
             */
            this.logOn = function (logType, content, jsonTreeOptions) {
                var flag = logType === "" ? "log" : "log." + logType;

                // Do this before the module check. That way we will know about special logs, but we
                // may not keep there data
                if (flag !== "log") {
                    store.specialLogs[logType] = true;
                }

                if (!store.modules[flag]) {
                    return;
                }

                if ('function' === typeof content) {
                    try {
                        content = content();
                    } catch (e) {
                        if (!store.instrumentationErrors) {
                            store.instrumentationErrors = [];
                        }
                        store.instrumentationErrors.push({flag: flag, error: e});
                        return;
                    }
                }

                if (!store.modules[flag].data) {
                    store.modules[flag].data = [];
                }

                store.modules[flag].data.push({content: content, jsonTreeOptions: jsonTreeOptions});
            };

            /**
             * Start profling a section of code. All the nodes of a specific profType are collected together and display in a single waterfall display.
             * Viewable with: /?my_debug=prof.{profType}
             * @method profOpen
             * @param {String} profType Name of profile.
             * @param {String} node An id of the specific sequence to capture
             * @param {String} d A discription of this node.
             *
             * Example:
             * <pre>
             * debug.profOpen("YUI_calls", "call 1", "call to something");
             * debug.profClose("YUI_calls", "call 1", "DNS lookup done");
             * debug.profClose("YUI_calls", "call 1", "Req sent");
             * debug.profClose("YUI_calls", "call 1", "Result recieved");
             * debug.profOpen("YUI_calls", "call 2", "call to something");
             * debug.profClose("YUI_calls", "call 2", "DNS lookup done");
             * ...
             * </pre>
             */
            this.profOpen = function (profType, node, d) {
                var flag = "prof." + profType;

                store.profile[profType] = true;

                if (!store.modules[flag]) {
                    return;
                }

                if (!store.modules[flag].data) {
                    store.modules[flag].data = {};
                }
                if (!store.modules[flag].events) {
                    store.modules[flag].events = [];
                }

                store.modules[flag].data[node] = {
                    desc: d,
                    start: this.timestamp(),
                    close: []
                };
            };

            /**
             * End a profiling section. There can be multipel  profClose for a single profOpen. Each will appear in the the output.
             * @method profClose
             * @param {String} profType Name of profile.
             * @param {String} node An id of the specific sequence to capture
             * @param {String} type Type of close condition
             */
            this.profClose = function (profType, node, type) {
                var flag = "prof." + profType;

                if (!store.modules[flag]) {
                    return;
                }

                if (!store.modules[flag].data) {
                    store.modules[flag].data = {};
                }

                if (!store.modules[flag].data[node]) {
                    return;
                }

                store.modules[flag].data[node].close.push({
                    type: type,
                    time: this.timestamp()
                });
            };

            /**
             * Mark a event that occured in the application. Events will show up as vertical lines in the waterfall.
             * They are usefull to mark important events accross all profiling sections of a waterfall.
             * @method profEvent
             * @param {String} profType Name of profile.
             * @param {String} type Type of the event
             *
             * Example:
             * <pre>
             * debug.profEvent("MyProfile", "End of important event");
             * </pre>
             */
            this.profEvent = function (profType, type) {
                var flag = "prof." + profType;

                if (!store.modules[flag]) {
                    return;
                }

                if (!store.modules[flag].events) {
                    store.modules[flag].events = [];
                }

                store.modules[flag].events.push({
                    type: type,
                    time: this.timestamp()
                });
            };
        }
    }

    DebugAPI.prototype = {
        on: function () {
        },

        addFlag: function (flag) {
            if (!this.store.modules[flag]) {
                this.store.modules[flag] = {};
            }
        },

        /**
         * Return a list of all flags that are set
         * @method flags
         * @return {Array} Array of flags that are set.
         */
        flags: function () {
            return this.Y.Object.keys(this.store.modules);
        },

        flag: function () {
            return false;
        },

        /**
         * Get data associated with a flag.
         * @method get
         * @param {String} key flag to set data for
         * @param {Object} value Default value to return if no data was collected for flag
         * @return {Object} Object containing debug data
         *
         * Example:
         * <pre>
         * data = debug.get("my_debug_flag");
         * use_data = data.something;
         * </pre>
         */
        get: function (key, value) {
            return this.store.modules[key] || value;
        },

        getSpecialLogs: function () {
            return Object.keys(this.store.specialLogs);
        },

        getKnownProf: function() {
            return Object.keys(this.store.profile);
        },

        getInstrumentationErrors: function () {
            return this.store.instrumentationErrors;
        },

        parseDebugParameters: function (parameters) {
            var list = [],
                Y = this.Y;

            if (parameters && !this.Y.Lang.isArray(parameters)) {
                parameters = [parameters];
            }

            Y.each(parameters, function (item) {
                var items = item.split(',');
                Y.each(items, function (item) {
                    if (item !== "") {
                        list.push(item);
                    }
                });
            });

            return list;
        },

        timestamp: function () {
            return this.microtime ? this.microtime.now() : new Date().getTime();
        },

        log: function () {
        },

        logOn: function () {
        },

        profOpen: function () {
        },

        profClose: function () {
        },

        profEvent: function () {
        }
    };

    Y.namespace('mojito').DebugAPI = DebugAPI;

}, '0.1.0', {  requires: [
]});

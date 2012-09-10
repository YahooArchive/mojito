/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, regexp: true, nomen:true*/
/*global YUI*/


YUI.add('mojito-debug-api', function(Y, NAME) {
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

            this.log = function (content, jsonTreeOptions) {
                this.logOn("", content, jsonTreeOptions);
            };

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
                    store.modules[flag].events = []
                }

                store.modules[flag].data[node] = {
                    desc: d,
                    start: this.timestamp(),
                    close: []
                };
            };

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

            this.profEvent = function (profType, type) {
                var flag = "prof." + profType;

                if (!store.modules[flag]) {
                    return;
                }

                if (!store.modules[flag].events) {
                    return;
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

        flags: function () {
            return this.Y.Object.keys(this.store.modules);
        },

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

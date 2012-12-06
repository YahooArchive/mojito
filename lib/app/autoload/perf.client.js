/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI,MOJITO_INIT*/


YUI.add('mojito-perf', function(Y, NAME) {

    if (!YUI._mojito) {
        YUI._mojito = {};
    }

    if (!YUI._mojito._perf) {
        YUI._mojito._perf = {};
        YUI._mojito._perf.mojito = {};
        YUI._mojito._perf.mojito.core = {};
        YUI._mojito._perf.mojito.core.msg = 'Framework start time';
        YUI._mojito._perf.mojito.core.time =
            typeof MOJITO_INIT !== 'undefined' ?
                    MOJITO_INIT :
                    new Date().getTime();
    }

    var store = YUI._mojito._perf,
        perfEnabled = false,
        perf;

    function print(group, label) {
        Y.log(group + ':' + label + ' ' +
            (store[group][label].time - store.mojito.core.time) +
            'ms', 'mojito', NAME);
    }

    function timestamp() {
        return new Date().getTime();
    }

    perf = {

        mark: function(group, label, msg) {

            if (!perfEnabled) { // Global prod flag
                return;
            }

            if (!group || !label) {
                return;
            }

            if (!store[group]) {
                store[group] = {};
            }

            if (!msg) {
                msg = '';
            }

            store[group][label] = {};
            store[group][label].msg = msg;
            store[group][label].time = timestamp();

            print(group, label);
        },


        dump: function() {

            var group,
                label;

            //MOJITO_INIT;

            for (group in store) {
                if (store.hasOwnProperty(group)) {
                    for (label in store[group]) {
                        if (store[group].hasOwnProperty(label)) {
                            print(group, label);
                        }
                    }
                }
            }
        },

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
        timeline: function(group, label, msg, id) {
            var m = perf.mark(group, label, msg, id);
            return {
                done: function () {
                    if (m) {
                        m.ms = timestamp() - m.time;
                    }
                }
            };
        }
    };

    Y.namespace('mojito').perf = perf;
});

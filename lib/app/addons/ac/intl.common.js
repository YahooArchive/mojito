/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true*/
/*global YUI*/


/**
 * @module ActionContextAddon
 */
YUI.add('mojito-intl-addon', function(Y, NAME) {

    function getLang(ac, module, label, args) {
        var lang, string;
        lang = Y.mojito.util.findClosestLang(ac.context.lang, ac.instance.langs) ||
                ac.instance.defaultLang || 'en';
        Y.Intl.setLang(module, lang);
        string = Y.Intl.get(module, label);
        if (string && args) {
            // simple string substitution
            return Y.Lang.sub(string, Y.Lang.isString(args) ? [args] : args);
        }
        return string;
    }

    /**
     * <strong>Access point:</strong> <em>ac.intl.*</em>
     * Internationalization addon
     * @class Intl.common
     */
    function IntlAddon(command, adapter, ac) {
        this.ac = ac;
    }


    IntlAddon.prototype = {

        namespace: 'intl',

        /**
         * Returns translated string.
         * @method lang
         * @param label {string} Optional. The initial label to be translated. If not provided, returns a copy of all resources.
         * @param args {string|Array|Object} optional parameters for the string
         * @return {string|Object} translated string for label or if no label was provided an object containing all resources.
         */
        lang: function(label, args) {
            var module = this.ac.instance.controller;
            return getLang(this.ac, module, label, args);
        },

        /**
         * Returns translated string from an app level 'shared' yui-lang bundle.
         * @method lang
         * @param label {string} Optional. The initial label to be translated. If not provided, returns a copy of all resources.
         * @param args {string|Array|Object} optional parameters for the string
         * @return {string|Object} translated string for label or if no label was provided an object containing all resources.
         */
        appLang: function(label, args) {
            var module = 'shared';
            return getLang(this.ac, module, label, args);
        },


        /**
         * Returns local-specified date.
         * @method formatDate
         * @param {Date} date The initial date to be formatted.
         * @return {string} formatted data for language.
         */
        formatDate: function(date) {
            var lang = Y.mojito.util.findClosestLang(this.ac.context.lang, this.ac.instance.langs) ||
                    this.ac.instance.defaultLang || 'en';
            //Y.log('Formatting date (' + date + ') in lang "' +
            //    lang + '"', 'debug', NAME);
            Y.Intl.setLang('datatype-date-format', lang);
            return Y.DataType.Date.format(date, {format: '%x'});
        }
    };

    Y.namespace('mojito.addons.ac').intl = IntlAddon;

}, '0.1.0', {requires: [
    'intl',
    'datatype-date',
    'mojito',
    'mojito-util',
    'mojito-config-addon'
]});


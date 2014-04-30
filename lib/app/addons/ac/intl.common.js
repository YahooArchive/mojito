/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen: true*/
/*global YUI*/


/**
 * @module ActionContextAddon
 */
YUI.add('mojito-intl-addon', function(Y, NAME) {

    // Overwriting setLang such that yuiActiveLang is not set,
    // this prevents independent requests from interfering with each other.
    // Previously if one request set a valid language, a subsequent request with
    // an invalid language would end up using the previous language.
    var setLang = function (module) {
        //delete Y.Intl._mod(module).yuiActiveLang;
        return Y.Intl.setLang.apply(Y.Intl, arguments);
    };

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
            var lang = this.ac.instance.closestLang || 'yuiRootLang',
                module = this.ac.instance.controller,
                activeLang = Y.Intl._mod(module).yuiActiveLang,
                string;

            // Deleting the active lang in order to be independent of
            // previous languages set.
            delete Y.Intl._mod(module).yuiActiveLang;
            Y.Intl.setLang(module, lang);
            string = Y.Intl.get(module, label);
            Y.Intl._mod(module).yuiActiveLang = activeLang;
            if (string && args) {
                // simple string substitution
                return Y.Lang.sub(string, Y.Lang.isString(args) ? [args] : args);
            }
            return string;
        },


        /**
         * Returns local-specified date.
         * @method formatDate
         * @param {Date} date The initial date to be formatted.
         * @return {string} formatted data for language.
         */
        formatDate: function(date) {
            var lang = this.ac.instance.closestLang || 'en',
                module = 'datatype-date-format',
                activeLang = Y.Intl._mod(module).yuiActiveLang,
                formattedDate;

            // Deleting the active lang in order to be independent of
            // previous languages set.
            delete Y.Intl._mod(module).yuiActiveLang;
            Y.Intl.setLang(module, lang);
            formattedDate = Y.DataType.Date.format(date, {format: '%x'});
            Y.Intl._mod(module).yuiActiveLang = activeLang;
            return formattedDate;
        }
    };

    Y.namespace('mojito.addons.ac').intl = IntlAddon;

}, '0.1.0', {requires: [
    'intl',
    'datatype-date',
    'mojito',
    'mojito-config-addon'
]});


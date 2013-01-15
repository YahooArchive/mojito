/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, nomen:true */
/*global YUI*/


/**
 * @module ActionContextAddon
 */
YUI.add('mojito-deploy-addon', function (Y, NAME) {

    'use strict';

    function renderListAsHtmlAssets(list, type) {
        var i,
            data = '',
            url;

        if ('js' === type) {
            for (i = 0; i < list.length; i += 1) {
                // TODO: Fuly escape any HTML chars in the URL to avoid trivial
                // attribute injection attacks. See owasp-esapi reference impl.
                url = encodeURI(list[i]);
                data += '<script type="text/javascript" src="' +
                    url + '"></script>\n';
            }
        } else if ('css' === type) {
            for (i = 0; i < list.length; i += 1) {
                // TODO: Escape any HTML chars in the URL to avoid trivial
                // attribute injection attacks. See owasp-esapi reference impl.
                url = encodeURI(list[i]);
                data += '<link rel="stylesheet" type="text/css" href="' +
                    url + '"/>\n';
            }
        } else if ('blob' === type) {
            for (i = 0; i < list.length; i += 1) {
                // NOTE: Giant security hole...but used by everyone who uses
                // Mojito so there's not much we can do except tell authors of
                // Mojito applications to _never_ use user input to generate
                // blob content or populate config data. Whatever goes in here
                // can't be easily encoded without the likelihood of corruption.
                data += list[i] + '\n';
            }
        } else {
            Y.log('Unknown asset type "' + type + '". Skipped.', 'warn', NAME);
        }

        return data;
    }

    /**
     * <strong>Access point:</strong> <em>ac.frame.*</em>
     * Provides ability to create a html frame mojit HTML
     * @class Frame.server
     */
    function Addon(command, adapter, ac) {
        this._ac = ac;
    }


    Addon.prototype = {

        namespace: 'frame',

        /**
         * Set up the current mojito to behave has a HTML frame.
         * @method setup
         * @public
         * @param {Object} data The template data.
         * @param {Object} meta The mojit meta data.
         */
        setup: function (data, meta) {
            var ac = this._ac;

            // Make sure we have meta
            meta.http = meta.http || {};
            meta.http.headers = meta.http.headers || {};

            // Make sure our Content-type is HTML
            meta.http.headers['content-type'] =
                'text/html; charset="utf-8"';

            data.mojito_version = Y.mojito.version;

            // Add all the assets we have been given to our local store
            ac.assets.addAssets(meta.assets);
        },

        /**
         * Attach the HTML frame assets.
         * @method attach
         * @public
         * @param {Object} data The template data.
         * @param {Object} meta The mojit meta data.
         */
        attach: function (data, meta) {
            var ac = this._ac;

            // Attach assets found in the "meta" to the page
            Y.Object.each(ac.assets.getAssets(), function (types, location) {
                if (!data[location]) {
                    data[location] = '';
                }
                Y.Object.each(types, function (assets, type) {
                    data[location] += renderListAsHtmlAssets(assets, type);
                });
            });
        }

    };

    Y.namespace('mojito.addons.ac').frame = Addon;

}, '0.1.0', {requires: [
    'mojito-assets-addon'
]});

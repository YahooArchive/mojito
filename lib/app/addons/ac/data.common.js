/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint nomen:true*/
/*global YUI*/

/**
 * @module ActionContextAddon
 */
YUI.add('mojito-data-addon', function (Y, NAME) {

    'use strict';

    /**
     * <strong>Access point:</strong> <em>ac.data.*</em> and  <em>ac.pageData.*</em>
     * Addon that provides access to the data and pageData models
     * @class Data.common
     */
    function Addon(command, adapter, ac) {
        var Class = (ac.context && ac.context.runtime !== 'client' ? Y.Model.Vanilla : Y.Model);
        // create data if needed (on the client side, the mojit proxy is responsible)
        ac.data = command.instance.data = command.instance.data || new Class();
        // creating pageData if needed
        ac.pageData = adapter.page.data = adapter.page.data || new Class();
    }

    // The trick here is not to define the plugin namespace,
    // so we can hang data and pageData from ac object directly.

    Y.namespace('mojito.addons.ac').data = Addon;

}, '0.1.0', {requires: [
    'mojito',
    'model-vanilla',
    'model'
]});

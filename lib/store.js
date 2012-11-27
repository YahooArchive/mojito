/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true*/


//  ----------------------------------------------------------------------------
//  Prerequisites
//  ----------------------------------------------------------------------------

var libpath = require('path'),
    YUIFactory = require('./yui-sandbox.js');

//  ----------------------------------------------------------------------------
//  Store
//  ----------------------------------------------------------------------------

/**
 * A factory object providing methods for creating and managing ResourceStore
 * instances.
 */
var Store = {};


/**
 * Creates a new server-side resource store instance and returns it.
 * @method createStore
 * @param {{root: string,
 *          context: Object,
 *          appConfig: Object,
 *          verbose: boolean}} options An object containing store options.
 * @return Y.mojito.ResourceStore
 */
Store.createStore = function(options) {

    var store,
        YUI,
        Y;

    if (!options) {
        options = {};
    }
    if (!options.root) {
        options.root = process.cwd();
    }
    if (!options.context) {
        options.context = {};
    }

    // Create a sandboxed YUI instance. This is necessary to avoid shared
    // metadata with the main Mojito execution context and the execution context
    // of the ResourceStore instance.
    YUI = YUIFactory.getYUI();


    // Configure the prerequisites and load the resource store impl code.
    Y = YUI({
        useSync: true,
        modules: {
            'mojito': {
                fullpath: libpath.join(__dirname, 'app/autoload/mojito.common.js')
            },
            'mojito-util': {
                fullpath: libpath.join(__dirname, 'app/autoload/util.common.js')
            },
            'mojito-resource-store': {
                fullpath: libpath.join(__dirname, 'app/autoload/store.server.js')
            }
        }
    });
    Y.use('mojito-resource-store');

    store = new Y.mojito.ResourceStore({
        root: options.root,
        context: options.context,
        appConfig: options.appConfig
    });

    store.preload();

    return store;
};

//  ----------------------------------------------------------------------------
//  EXPORT(S)
//  ----------------------------------------------------------------------------

module.exports = Store;


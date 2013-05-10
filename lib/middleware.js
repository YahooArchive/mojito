/**
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint nomen:true, node:true*/

/**
Main module in the Mojito package that is responsible for creating the mojito
instance to the attached to the `express` app.

@module mojito
@submodule middleware
**/

'use strict';

var debug = require('debug')('middleware'),
    libpath = require('path'),
    Mojito = {};

/**
An ordered list of the middleware module names to load for a standard Mojito
server instance.
@type Array
**/
Mojito.MOJITO_MIDDLEWARE = [
    'mojito-handler-static',
    'mojito-parser-body',
    'mojito-parser-cookies',
    'mojito-contextualizer',
    'mojito-handler-tunnel',
    'mojito-router',
    'mojito-handler-dispatcher',
    'mojito-handler-error'
];

exports = module.exports = {

    /**
    Registers the default middleware that ships with Mojito.

    Usage:

        app.use(mojito.middleware());

    By default, Mojito does not add those middleware in case application 
    need customization.

    @method registerMiddleware
    @public
    @param {express.application} app optional
    @return {middleware}
    **/
    middleware: function (app) {

        module.exports.defaultMiddleware().forEach(function (mid) {
            debug('app.use() => %s', mid);
            app.use(module.exports[mid]);
        });

        return false;
    },

    /**
    Returns a list of middleware ready for use.

        var express = require('express'),
            mojito = require('mojito'),
            app;

        app = express();
        app.mojito.middleware().forEach(function (mid) {
            app.use(app.mojito[mid]);
        });


    Or better, use `app.use(app.mojito.registerMiddleware());` sugar.

    @method middleware
    @public
    @return {Array} list of middlewares for a default Mojito application
    **/
    defaultMiddleware: function () {
        return [].concat(Mojito.MOJITO_MIDDLEWARE);
    },


    /**
    Expose each middleware listed in Mojito.MOJITO_MIDDLEWARE as mojito.*
    e.g:

        app.use(mojito['mojito-handler-static']);

    @method exposeMiddleware
    @protected
    @param {express.application} app `express` app instance
    @param {Function} dispatcher mojito's dispatcher middleware
    @param {Object} midConfig configuration object to pass to middleware
    @param {Array} middleware middleware names
    **/
    exposeMiddleware: function () {
        var m,
            midName,
            midPath,
            midFactory,
            fn = module.exports,
            middleware = fn.defaultMiddleware();


        for (m = 0; m < middleware.length; m = m + 1) {
            midName = middleware[m];
            try {
                // Assume it is an NPM package
                midFactory = require(midName);
                debug('require() middleware native: ' + midName);
            } catch (e1) {
                try {
                    // Attempt to load by known mojito middleware path
                    midPath = libpath.join(__dirname, 'app', 'middleware', midName);
                    debug('require() middleware by path: ' + midPath);
                    midFactory = require(midPath);
                } catch (e2) {
                    // give up
                    midFactory = null;
                    console.error('failed to attach middleware: ' + midName);
                }
            }
            if (midFactory) {
                fn[midName] = midFactory();
            }
        }
    }

};

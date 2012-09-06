/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/


/**
 * This object is responsible for running mojits.
 * @class MojitoDispatcher
 * @constructor
 * @param {ServerStore} resourceStore the store to use.
 * @private
 */
YUI.add('mojito-resource-store-adapter', function(Y, NAME) {

    var logger;


    Y.namespace('mojito').ResourceStoreAdapter = {

        ENV: '',


        init: function(env, resourceStore, globalLogger) {

            // must be passed the Mojito logger and use it for consistent
            // logging because the Y.log within this scope has not been mutated
            // yet
            logger = globalLogger;

            logger.log('resource store adapter init', 'mojito', NAME);

            this.ENV = env;
            this.store = resourceStore;

            return this;
        },


        expandInstance: function(instance, ctx, cb) {
            //logger.log('expandInstance', 'mojito', NAME);
            return this.expandInstanceForEnv(this.ENV, instance, ctx, cb);
        },


        expandInstanceForEnv: function(env, inInstance, context, callback) {
            var me = this;

            return this.store.expandInstanceForEnv(env, inInstance, context, function(err, outInstance) {
                if (err) {
                    callback(err, {});
                    return;
                }

                // Ensure the "instance" has been properly resolved. If
                // there are no specs in the application.json file, there is
                // an error below because the instance is invalid. We should
                // check here for a valid instance object and throw an error
                // if it is not. This happens because someone could create a
                // routes.json file with routes that don't route to mojit
                // instances, and the URI router creates invalid commands,
                // which are passed into the dispatch.
                if (!me.validate(outInstance)) {
                    callback(new Error('Instance was not valid.'));
                    return;
                }

                if (!outInstance.instanceId) {
                    outInstance.instanceId = Y.guid();
                    //DEBUGGING:  outInstance.instanceId += '-data-common-' +
                    //    [outInstance.base||'', outInstance.type||''].join('-');
                }
                // DEPRECATED, but kept in case a user is using.
                outInstance.guid = outInstance.instanceId;

                callback(null, outInstance);
            });
        },


        getApp: function(env, context, callback) {
            var obj = {};

            callback(obj);
        },


        getAppPath: function() {
            return this.store._config.root;
        },


        getAppConfig: function(context) {
            return this.store.getAppConfig(context);
        },


        validate: function(base) {
            if (!base.type || !base.yui) {
                return false;
            }
            return true;
        },


        isCached: function(env, instance, context) {
            return false;
        },


        getCached: function(env, instance, context) {
            return {};
        },


        cache: function(env, instance, context, obj) {
            return false;
        },


        serializeClientStore: function(ctx) {
            //logger.log('serializeClientStore', 'warn', NAME);
            return this.store.serializeClientStore(ctx);
        },


        getMojitTypeDetails: function(env, ctx, mojitType, dest) {
            //logger.log('getMojitTypeDetails', 'warn', NAME);
            return this.store.getMojitTypeDetails(env, ctx, mojitType, dest);
        },


        getRoutes: function(ctx) {
            //logger.log('getRoutes', 'warn', NAME);
            return this.store.getRoutes(ctx);
        }
    };

}, '0.1.0', {requires: [
    'json-stringify'
]});

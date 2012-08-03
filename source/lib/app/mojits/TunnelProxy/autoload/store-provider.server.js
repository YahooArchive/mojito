/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true*/
/*global YUI*/


YUI.add('tunnel-store-provider-addon', function(Y, NAME) {

    function Addon(command, adapter, ac) {
        this.instance = command.instance;
        this.scripts = {};
        this.ac = ac;
        this.dispatch = ac.dispatch;
    }


    Addon.prototype = {

        namespace: 'store',

        /**
         * Declaration of store requirement.
         * @private
         * @param {ResourceStore} rs The resource store.
         */
        setStore: function(rs) {
            this.rs = rs;
            if (rs) {
                Y.log('Initialized and activated with Resource Store', 'info',
                    NAME);
            }
        },


        getStore: function() {
            return this.rs;
        }
    };

    Y.namespace('mojito.addons.ac').store = Addon;

}, '0.1.0');

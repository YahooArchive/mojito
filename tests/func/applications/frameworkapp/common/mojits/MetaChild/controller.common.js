/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('MetaChild', function(Y) {

/**
 * The Stateful module.
 *
 * @module Stateful
 */

    /**
     * Constructor for the Controller class.
     *
     * @class Controller
     * @constructor
     */
    Y.mojito.controller = {

        init: function(spec) {
            this.spec = spec;
        },

        /**
         * Method corresponding to the 'index' action.
         *
         * @param ac {Object} The action context that provides access
         *        to the Mojito API.
         */
        index: function(ac) {
            ac.done();
        },

        store: function(ac) {
            var metainput = ac.params.getFromMerged('metainput');
            Y.log("stored data....."+ metainput);
            ac.meta.store("mydata", metainput)
            ac.done();
        }
    };

}, '0.0.1', {requires: ['mojito-meta-addon']});

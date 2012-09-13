/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('Binders', function(Y, NAME) {

/**
 * The Binders module.
 *
 * @module Binders
 */

    /**
     * Constructor for the Controller class.
     *
     * @class Controller
     * @constructor
     */
    Y.namespace('mojito.controllers')[NAME] = {

        init: function(mojitSpec) {
            this.spec = mojitSpec;
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
        myIndex: function(ac) {
		   //Y.log("In the myIndex");
           ac.models.Binders.getData(function(data) {
                 ac.models.Binders.getTaco(function(taco) {
                     data.version = ac.config.get('version');
                     //console.log("VERSION: " + data.version);
                     data.extra = ac.config.get('extra');
                     data.taco = taco;
                     ac.done(data);
                 });
             });
        }
    };

}, '0.0.1', {requires: ['mojito']});

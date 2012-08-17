/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('MojitContainer', function(Y, NAME) {

/**
 * The MojitContainer module.
 *
 * @module MojitContainer
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
            ac.composite.done();
        },
        myMojits: function(ac) {
            Y.log('index()', 'debug', NAME);

			ac.composite.done({ 
				template: { 
        			title: 'My Child Mojits:' 
        		} 
        	});
		
        }

    };

}, '0.0.1', {requires: []});

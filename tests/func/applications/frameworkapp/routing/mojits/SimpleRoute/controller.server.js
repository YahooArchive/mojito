/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('SimpleRoute', function(Y, NAME) {

/**
 * The SimpleRoute module.
 *
 * @module SimpleRoute
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

        index: function(actionContext) {
            var config = actionContext.config.get();
			var type = actionContext.type;
			var id = config.id;
			//actionContext.http.setHeader('content-type', 'text/html');
	        actionContext.done({displaytext: 'This is a simple mojit for testing routing - ' + type + " (" + id + ")"});
        },

		myAction: function(actionContext) {
        	//actionContext.http.setHeader('content-type', 'text/html');
		    actionContext.done({displaytext: 'myAction output - This is another action'});
		}

    };

}, '0.0.1', {requires: ['mojito', 'mojito-http-addon']});

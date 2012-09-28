/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('CM_Layout', function(Y, NAME) {

/**
 * The CM_Layout module.
 *
 * @module CM_Layout
 */

    /**
     * Constructor for the Controller class.
     *
     * @class Controller
     * @constructor
     */
    Y.namespace('mojito.controllers')[NAME] = {

        init: function(config) {
            this.config = config;
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
        myIndex: function(ac) {
            Y.log('index()', 'debug', NAME);

            var passParams = ac.params.getFromUrl('pass_params') || 'false';

            var parentConfig = ac.config.get();
			var myId = parentConfig.id;
            var childrenConfig = parentConfig.children;

            var childInfo = [];

            Y.Object.each(childrenConfig, function(childSpec, childName) {
                var info = {
                    name: childName,
                    specs: JSON.stringify(childSpec)
                };
                Y.log("***********************************************ChildName: " + childName + " and child spec: " +  JSON.stringify(childSpec));
                childInfo.push(info);
            });

			if (passParams === "false")
			{
				ac.composite.done({ 
					template: { 
						title: 'This is the title from controller.js of ' + myId, childData: childInfo 
					} 
				});
			}
            else
            {
            	ac.composite.done({ 
            		template: { 
            			title: 'This is the title from controller.js of ' + myId, childData: childInfo 
            		},
            		params: {
            			fromParent: "I am from parent"
            		}
            	});
            }
        }
    };

}, '0.0.1', {requires: [
    'mojito',
    'mojito-config-done',
    'mojito-composite-done',
    'mojito-params-addon']});

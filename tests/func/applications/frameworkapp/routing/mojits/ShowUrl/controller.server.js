/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('ShowUrl', function(Y, NAME) {

/**
 * The ShowUrl module.
 *
 * @module ShowUrl
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
        index: function(actionContext) {
	        var mojitName = actionContext.params.getFromUrl('mojit_name'),
	            mojitAction = actionContext.params.getFromUrl('mojit_action'),
	            mojitUrlParams = actionContext.params.getFromUrl('mojit_urlparams'),
	            mojitUrl = actionContext.params.getFromUrl('mojit_url'),
	            mojitVerb = actionContext.params.getFromUrl('mojit_verb'),
	            nameExists = mojitName ? "YES" : "NO",
	            actionExists = mojitAction ? "YES" : "NO";
	            urlparamsExists = mojitUrlParams ? "YES" : "NO";
	            urlExists = mojitUrl ? "YES" : "NO";

	        console.log("**********************" + mojitName);
	        console.log("**********************" + mojitAction);
	        console.log("**********************" + mojitUrlParams);
	        console.log("**********************" + mojitUrl);
	        console.log("**********************" + mojitVerb);

	        if (nameExists === "YES" && actionExists === "YES")
	        {
	        	var url = "";
	        	var error = "";
	        	try{
	        	    if (urlparamsExists === "YES"){
    		            url = actionContext.url.make(mojitName, mojitAction, 'MySpecialRoute', 'GET', mojitUrlParams);
	        	    } else {
    		            url = actionContext.url.make(mojitName, mojitAction);
	        	    }
	        	}catch(error) {
		        	url = error;
		        }
	            var data = {
	                url: url,
	                name: mojitName,
	                action: mojitAction
	            };
	            //actionContext.http.setHeader('content-type', 'text/html');
	            actionContext.done(data);
	         } else if (urlExists === "YES"){
	            var matchroute = "";
 	        	var error = "";
 	        	try{
 	        	    matchroute = actionContext.url.find(mojitUrl, mojitVerb);
 	        	}catch(error) {
 		        	url = error;
 		        }
 		        console.log(matchroute);
 		        if(matchroute != null){
 	                var data = {
     	                url: mojitUrl,
     	                verbs: matchroute.verbs.GET,
     	                call: matchroute.call,
     	                name: matchroute.name,
     	                params: matchroute.params.secret,
 	                }
                }else{
                    var data = {
     	                url: mojitUrl,
                    } 
                }
 	            actionContext.done(data);
	         }
    	}
    };

}, '0.0.1', {requires: ['mojito', 'mojito-http-addon']});

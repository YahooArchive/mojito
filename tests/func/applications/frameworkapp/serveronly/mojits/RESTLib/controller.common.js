/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('RESTLib', function(Y) {

/**
 * The RESTLib module.
 *
 * @module RESTLib
 */

    /**
     * Constructor for the Controller class.
     *
     * @class Controller
     * @constructor
     */
    Y.mojito.controller = {

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
		        //console.log(actionContext.http.getRequest());
	        	var data = {
	        		hostname: actionContext.http.getRequest().headers.host
	        	};
	        	actionContext.done(data);
        		//actionContext.done();
	        },

	        simpleWSCall: function(actionContext) {
	        	var hostPort = getHostNameAndPort(actionContext);
	            actionContext.models.RESTLib.callWSGET(hostPort, function(error, response){
	                if (!error)
	                {
	                    //console.log("This is the response: " + response);
	                	actionContext.http.setHeader('content-type', 'text/html');
	                    actionContext.done(response.getBody());
	                }
	                else
	                {
	                    //console.log("This is error: " + JSON.stringify(error));
	               		//actionContext.http.setStatusCode(error.status);
	                    actionContext.done(error.responseText);
	                }

	            });
	        },

	        inspectResponse: function(actionContext) {
	        	var hostPort = getHostNameAndPort(actionContext);
	            //console.log("***************************HostPort: " + hostPort);
	            actionContext.models.RESTLib.callWSGET(hostPort, function(error, response){
	                if (!error)
	                {
	                    //console.log(response.getHeaders());
	                    var responseParts = {
	                        statusCode: response.getStatusCode(),
	                        statusMsg: response.getStatusMessage(),
	                        body: response.getBody(),
	                        headers: JSON.stringify(response.getHeaders()),
	                        header_powered_by: response.getHeader('x-powered-by'),
	                        header_content_type: response.getHeader('content-type'),
	                        header_encoding: response.getHeader('transfer-encoding'),
	                        header_not_exist: response.getHeader('custom-header')
	                    };
	                    actionContext.done(responseParts);
	                }
	                else
	                {
	               		//actionContext.http.setStatusCode(error.status);
	                    actionContext.done(error.responseText);
	                }
	            });
	        },
	        WSTimeout: function(actionContext)
	        {
	        	var hostPort = getHostNameAndPort(actionContext);
	            actionContext.models.RESTLib.callTimeoutWS(hostPort, function(error, response){
	                if (!error)
	                {
	                    actionContext.done(response);
	                }
	                else
	                {
	                    actionContext.done(error.responseText);
	                    //console.log("This is the error: " + JSON.stringify(error));
	                }

	            });
	        },

	        inspectError: function(actionContext)
	        {
	        	var hostPort = getHostNameAndPort(actionContext);
	            actionContext.models.RESTLib.callInvalidWS(hostPort, function(error, response){
	                if (!error)
	                {
	                	actionContext.http.setHeader('content-type', 'text/html');
	                    actionContext.done(response);
	                }
	                else
	                {
	               		//actionContext.http.setStatusCode(error.status);
	                	console.log(error);
	                	var err = new Error("This is my error message");
	                	err.code = 404;
	                	actionContext.error(err);
	                    //actionContext.done(error.responseText);
	                    //console.log("This is the error: " + JSON.stringify(error));
	                }

	            });
	        },

	        testGETParam: function(actionContext)
	        {
	        	var hostPort = getHostNameAndPort(actionContext);
	            var sprintNumToPass = actionContext.params.getFromMerged("sprint_num");
	            var negativeTest = actionContext.params.getFromMerged("negative_test");
	            var outFunction = function(error, response)
	            {
	                if (!error)
	                {
	                	actionContext.http.setHeader('content-type', 'text/html');
	                    actionContext.done(response);
	                }
	                else
	                {
	                    actionContext.done(error.responseText);
	                    //console.log("This is the error: " + JSON.stringify(error));
	                }
	            };

	            if (negativeTest === "true")
	            {
	                actionContext.models.RESTLib.wsWithGETParamsNeg(hostPort, sprintNumToPass, outFunction);
	            }
	            else
	            {
	                actionContext.models.RESTLib.wsWithGETParams(hostPort, sprintNumToPass, outFunction);
	            }
	        },

	        testPOSTParam: function(actionContext)
	        {
	        	var hostPort = getHostNameAndPort(actionContext);
	            var sprintNumToPass = actionContext.params.getFromMerged("sprint_num");
	            var negativeTest = actionContext.params.getFromMerged("negative_test");
	            var outFunction = function(error, response)
	            {
	                if (!error)
	                {
	                	actionContext.http.setHeader('content-type', 'text/html');
	                    actionContext.done(response);
	                }
	                else
	                {
	                    actionContext.done(error.responseText);
	                    //console.log("This is the error: " + JSON.stringify(error));
	                }
	            };

	            if (negativeTest === "true")
	            {
	                actionContext.models.RESTLib.wsWithPOSTParamsNeg(hostPort, sprintNumToPass, outFunction);
	            }
	            else
	            {
	                actionContext.models.RESTLib.wsWithPOSTParams(hostPort, sprintNumToPass, outFunction);
	            }
	        },

	        testPUTParam: function(actionContext)
	        {
	        	var hostPort = getHostNameAndPort(actionContext);
	            var sprintNumToPass = actionContext.params.getFromMerged("sprint_num");
	            //var negativeTest = actionContext.params.getFromMerged("negative_test");
	            var outFunction = function(error, response)
	            {
	                if (!error)
	                {
	                	actionContext.http.setHeader('content-type', 'text/html');
	                    var statusCode = response.getStatusCode();
	                    actionContext.done("<p id=\"status\">" + statusCode + "</p>" + response.getBody());
	                }
	                else
	                {
	                    actionContext.done(error.responseText);
	                    console.log("This is the error: " + JSON.stringify(error));
	                }
	            };

	            actionContext.models.RESTLib.wsWithPUTParams(hostPort, sprintNumToPass, outFunction);

	            /*if (negativeTest === "true")
	            {
	                actionContext.models.RESTLib.wsWithPUTParamsNeg(hostPort, sprintNumToPass, outFunction);
	            }
	            else
	            {
	                actionContext.models.RESTLib.wsWithPUTParams(hostPort, sprintNumToPass, outFunction);
	            }*/
	        },

	        testDELETEParam: function(actionContext)
	        {
	        	var hostPort = getHostNameAndPort(actionContext);
	            var sprintNumToPass = actionContext.params.getFromMerged("sprint_num");
	            //var negativeTest = actionContext.params.getFromMerged("negative_test");
	            var outFunction = function(error, response)
	            {
	                if (!error)
	                {
	                	actionContext.http.setHeader('content-type', 'text/html');
	                    var statusCode = response.getStatusCode();
	                    actionContext.done("<p id=\"status\">" + statusCode + "</p>" + response.getBody());
	                }
	                else
	                {
	                    actionContext.done(error.responseText);
	                    console.log("This is the error: " + JSON.stringify(error));
	                }
	            };

	            actionContext.models.RESTLib.wsWithDELETEParams(hostPort, sprintNumToPass, outFunction);
	        },

	        testHEAD: function(actionContext)
	        {
	        	var hostPort = getHostNameAndPort(actionContext);
	            var sprintNumToPass = actionContext.params.getFromMerged("sprint_num");
	            var outFunction = function(error, response)
	            {
	                if (!error)
	                {
	                	actionContext.http.setHeader('content-type', 'text/html');
	                    var statusCode = response.getStatusCode();
	                    var headerInfo = response._resp.headers.new_header;
	                    actionContext.done("<p id=\"status\">"+ statusCode +"</p><p id=\"header\">new_header = " + headerInfo + "</p>" + response.getBody());
	                }
	                else
	                {
	                    actionContext.done(error.responseText);
	                    console.log("This is the error: " + JSON.stringify(error));
	                }
	            };

	            actionContext.models.RESTLib.wsWithHEAD(hostPort, sprintNumToPass, outFunction);
	        },

	        testHeaders: function(actionContext)
	        {
	        	var hostPort = getHostNameAndPort(actionContext);
	            var outFunction = function(error, response)
	            {
	                if (!error)
	                {
	                	actionContext.http.setHeader('content-type', 'text/html');
	                    actionContext.done(response);
	                }
	                else
	                {
	                    actionContext.done(error.responseText);
	                    console.log("This is the error: " + JSON.stringify(error));
	                }
	            };
	            actionContext.models.RESTLib.wsWithHeadersSettings(hostPort, outFunction);

	        },

	        //My WebServices

	        simpleWS: function(actionContext) {
	        	//console.log("I am here");
	        	//actionContext.http.setHeader('content-type', 'text/html');
	        	//actionContext.done("<p id=\"output\">This is a very simple web service</p>");
	        	actionContext.done({output: "This is a very simple web service"}, {view: {name: "wsOutput"}});
	        },

	        myWS: function(actionContext){
	            actionContext.models.RESTLib.myTimeConsumingWS(function (output){
	            	actionContext.http.setHeader('content-type', 'text/html');
	                actionContext.done(output);
	            });
	        },

	        printGETParams: function(actionContext){
	            var project = actionContext.params.getFromUrl("project");
	            var sprint = actionContext.params.getFromUrl("sprint");
	            var method = actionContext.http.getRequest().method;

	            var output = "<p id=\"output\">(METHOD: " + method + ") This is sprint " + sprint + " for the project " + project + "</p>";
	            actionContext.http.setHeader('content-type', 'text/html');
	            actionContext.done(output);
	        },

	        printPOSTParams: function(actionContext){
	            var project = actionContext.params.getFromBody("project");
	            var sprint = actionContext.params.getFromBody("sprint");
	            var method = actionContext.http.getRequest().method;

	            var output = "<p id=\"output\">(METHOD: " + method + ") This is sprint " + sprint + " for the project " + project + "</p>";
	            actionContext.http.setHeader('content-type', 'text/html');
	            actionContext.done(output);
	        },

	        printPUTParams: function(actionContext){
	            var project = actionContext.params.getFromUrl("project");
	            var sprint = actionContext.params.getFromUrl("sprint");
	            var method = actionContext.http.getRequest().method;

	            //var output = "<p id=\"output\">(METHOD: " + method + ") This is sprint " + sprint + " for the project " + project + "</p>";
	            var output = "<p id=\"output\">(METHOD: " + method + ")</p>";
	            actionContext.http.setHeader('content-type', 'text/html');
	            actionContext.done(output);
	        },

	        printDELETEParams: function(actionContext){
	            var project = actionContext.params.getFromMerged("project");
	            var sprint = actionContext.params.getFromMerged("sprint");
	            var method = actionContext.http.getRequest().method;

	            //var output = "<p id=\"output\">(METHOD: " + method + ") This is sprint " + sprint + " for the project " + project + "</p>";
	            var output = "<p id=\"output\">(METHOD: " + method + ")</p>";
	            actionContext.http.setHeader('content-type', 'text/html');
	            actionContext.done(output);
	        },

	        printHEADParams: function(actionContext){
	            /*var project = actionContext.params.getFromMerged("project");
	            var sprint = actionContext.params.getFromMerged("sprint");

	            var output = "<p id=\"output\">This is sprint " + sprint + " for the project " + project + "</p>";
	            */
	            actionContext.http.addHeader('new_header','dummy_value');
	            actionContext.done();
	        },

	        getParticularHeader: function(actionContext){
	            var reqObj = actionContext.http.getRequest();
	            var headers = reqObj.headers;
	            actionContext.http.setHeader('content-type', 'text/html');
	            actionContext.done("<p id=\"something\">" + JSON.stringify(headers) + "</p>" + "<p id=\"my_header\">" + headers.myheader + "</p>" + "<p id=\"connection\">" + headers.connection + "</p>");
	        }
	    };

	    function getHostNameAndPort(actionContext) {
	    	var hostPort;
	    	/*fromClient = actionContext.params.getFromMerged('fromClient');
	    	if (fromClient === "true")
	    	{
	    		hostPort = actionContext.params.getFromMerged('hostPort');
	    	}
	    	else
	    	{
	    		var reqObj = actionContext.http.getRequest();
	    		hostPort = reqObj.headers.host;
	    	}*/
	    	var reqObj = actionContext.http.getRequest();
			hostPort = reqObj.headers.host;
			
	    	return hostPort;
	    }
	
}, '0.0.1', {requires: ['mojito-http-addon']});
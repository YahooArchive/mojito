/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('HttpAddonParent', function(Y) {

/**
 * The HttpAddonParent module.
 *
 * @module HttpAddonParent
 */

    /**
     * Constructor for the Controller class.
     *
     * @class Controller
     * @constructor
     */
    Y.mojito.controller = {

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
	        //actionContext.http.addHeader('x-generated-by', 'Mojito');
	        actionContext.http.addHeader('set-cookie', 'UserID=abc; Max-Age=3600');
	        var header = "";
	        var header = actionContext.http.getHeader('set-cookie'); //('x-generated-by');

	        // done:
            var template,
                ac = actionContext,
                cfg = ac.mojit.config,
                children = cfg.children;

            template = {};
            
//            ac.dispatch(cfg.children[0], {done: function() {}, flush: function() {}});

            ac.composite.execute(cfg, function(data, meta) {
            	console.log("CHILD meta:");
            	console.log(meta.http.headers);
                var merged = Y.merge(template, data);
                ac.done(merged, meta);

            }, this);

        },

        testRequestObj: function(ac){
        	var reqObj = ac.http.getRequest();
        	//console.log(reqObj);
        	ac.http.setHeader('content-type', 'text/html');
        	ac.done({
        		method: reqObj.method,
        		url: reqObj.url,
        		trailers: reqObj.trailers,
        		httpVersion: reqObj.httpVersion,
        		headers: JSON.stringify(reqObj.headers)
        	});
        },

        testSimpleRedirect: function(actionContext){
        	var testMethod = actionContext.params.getFromUrl('method');
        	var mojitName = actionContext.params.getFromUrl('mojit');
        	var action = actionContext.params.getFromUrl('action');
        	//actionContext.http.redirect(mojitName, action, {}, testMethod);
        	actionContext.http.redirect('/' + mojitName + "/" + action);
        },
        
        callWSWithXhr: function(actionContext){
        	var reqObj = actionContext.http.getRequest();
            var hostPort = reqObj.headers.host;
            var isXhr = actionContext.params.getFromUrl('isXhr') || 'false';
            actionContext.models.HttpAddonParent.callWS(hostPort, isXhr, function(error, response){
                if (!error)
                {
                	actionContext.http.setHeader('content-type', 'text/html');
                    actionContext.done(response.getBody());
                }
                else
                {
                    actionContext.done(error.responseText);
                }
            });
        },
        
        checkingXhr: function(actionContext) {
        	var isXhr = actionContext.http.isXhr();
        	actionContext.done("<p id=\"xhrValue\">This is the Xhr value: " + isXhr + "</p>");
        },
        
        testResponseObj: function(actionContext){
        	var response = actionContext.http.getResponse();
        	
        	var data = {
        		headers : JSON.stringify(response._headers),
        		shouldKeepAlive : response.shouldKeepAlive,
        		hasBody : response._hasBody
        	};
        	actionContext.http.setHeader('content-type', 'text/html');
        	actionContext.done(data);
        },
        
        testAddSetHeader: function(actionContext){
        	actionContext.http.addHeader('my_header', 'my_header1_value');
        	var option = actionContext.params.getFromUrl('header_option') || "add";
        	if (option == 'add')
        	{
        		console.log("I am adding the header");
        		actionContext.http.addHeader('my_header', 'my_header2_value');
        	}
        	else if (option == "set")
        	{
        		actionContext.http.setHeader('my_header', 'my_final_header_value');
        	}
        	actionContext.http.setHeader('content-type', 'text/html');
        	actionContext.done("<p>I am done...Please check for the headers.</p>");
        },
        
        testAddSetHeaders: function(actionContext){
        	var headers = {
        			"foo": "bar",
        			"foo1": "bar1",
        			"foo2": "bar2"
        	};
        	actionContext.http.addHeaders(headers);
        	var option = actionContext.params.getFromUrl('header_option') || "add";
        	if (option == 'add')
        	{
        		actionContext.http.addHeaders({
        			"foo": "bar_one_more",
        			"foo1": "bar1_one_more"
        		});
        	}
        	else if (option == "set")
        	{
        		actionContext.http.setHeaders({
        			"foo": "bar_final",
        			"foo1": "bar1_final",
        			"foo2": "" //this will remove the header
        		});
        	}
        	actionContext.http.setHeader('content-type', 'text/html');
        	actionContext.done("I am done...Please check for the headers.");
        },
        
        testGetHeaders: function(actionContext){
        	var allHeaders = actionContext.http.getHeaders();
        	var valueMatch = "true";
        	
        	Y.Object.each(allHeaders, function(headerValue, headerKey) {
        		var valueFromCommand = actionContext.http.getHeader(headerKey);
        		if (valueFromCommand == headerValue)
        		{
        			valueMatch = valueMatch + "true";
        		}
        		else
        		{
        			valueMatch = valueMatch + "false";
        		}
            });
        	
        	actionContext.http.setHeader('content-type', 'text/html');
        	if (valueMatch.indexOf("false") == -1)
        	{
        		actionContext.done("<p id=\"output\">All Headers match</p>");
        	}
        	else
        	{
        		actionContext.done("<p id=\"output\">All Headers DOES NOT match</p>");
        	}
        },
        
        testHeadersWithChild: function(actionContext){
        	var template,
	            ac = actionContext,
	            cfg = ac.mojit.config,
	            children = cfg.children;

        	template = {};
        	ac.composite.execute(cfg, function(data, meta) {
            	console.log("CHILD meta:");
            	console.log(meta);
            	console.log(meta.http.headers);
            	ac.http.setHeader('my_header', 'ByParent');
                var merged = Y.merge(template, data);
                ac.done(merged, meta);
            }, this);
        }
    };

}, '0.0.1', {requires: ['mojito-http-addon']});

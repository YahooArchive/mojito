/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('CoverageClient', function(Y) {

    Y.mojito.controller = {

        init: function(config) {
            this.config = config;
        },

        index: function(actionContext) {
	        var data = {
        		hostname: actionContext.http.getRequest().headers.host
        	};
            actionContext.done(data);
        },
        myIndex: function(actionContext) {
			Y.log("I am in the myIndex function");
			var coverageResult = _yuitest_coverage;
			var jsonData = JSON.stringify(coverageResult);
			actionContext.done(jsonData);
        },

		collectClientCodeCoverageData: function(actionContext) {
			var fs = require('fs');
	    	var mojitoVer = Y.mojito.version;
	        var postedDataRaw = actionContext.yiv.getData('body', 'coverageData','unsafe_raw');
	        //console.log(actionContext.yiv.getData('body', 'coverageData','unsafe_raw'));
	    	var applicationName = actionContext.params.getFromBody('application');
			var jsonData = actionContext.params.getFromBody('coverageData');
			if (!jsonData)
			{
				jsonData = postedDataRaw;
			}
			
			//console.log("This is the POST data received: " + jsonData);
	    	
	    	var dir_structure = "/tmp/coverage/mojito/" + mojitoVer + "/data/" + applicationName;
	    	var fileName = "data.json";
	    	var coverageData = dir_structure + "/" + fileName;
	    	
	    	var exec = require('child_process').exec;
	        child = exec("mkdir -p " + dir_structure, function (error, stdout, stderr) {
	        	  response = stdout;
	        	  errorStr = stderr;
	        	  //Y.log('This is the stderr: ' + stderr, "INFO");
	        	  if (error !== null) {
	        	      Y.log('exec error: ' + error);
	        	  }
	        	fs.writeFile(coverageData, jsonData, function (err) {
	        	  if (err) throw err;
	        	  Y.log('File is saved!' + coverageData, "INFO");
	        	});
				actionContext.done("Executed the coverage mojit for " + applicationName + " application");
			});
		}


    };

}, '0.0.1', {requires: ['mojito-http-addon', 'yiv-ac-plugin']});

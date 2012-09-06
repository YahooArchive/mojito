/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('Coverage', function(Y, NAME) {

    Y.namespace('mojito.controllers')[NAME] = {

        init: function(config) {
            this.config = config;
        },

        index: function(actionContext) {
	    	var fs = require('fs');
	    	var mojitoVer = Y.mojito.version;
	    	var applicationName = actionContext.params.getFromUrl('application');
	    	
	    	var dir_structure = "/tmp/coverage/mojito/" + mojitoVer + "/data/" + applicationName;
	    	var fileName = "data.json";
	    	var coverageData = dir_structure + "/" + fileName;
	    	
	    	var exec = require('child_process').exec;
	        child = exec("mkdir -p " + dir_structure, function (error, stdout, stderr) {
	        	  response = stdout;
	        	  errorStr = stderr;
	        	  Y.log('This is the stderr: ' + stderr, "INFO");
	        	  if (error !== null) {
	        	      Y.log('exec error: ' + error);
	        	  }
	          	var coverageResult = _yuitest_coverage;
	        	var jsonData = JSON.stringify(coverageResult);
	        	fs.writeFile(coverageData, jsonData, function (err) {
	        	  if (err) throw err;
	        	  Y.log('File is saved!' + coverageData, "INFO");
	        	});
	        	actionContext.done("Executed the coverage mojit for " + applicationName + " application");
	        });
        }

    };

}, '0.0.1', {requires: ['mojito']});

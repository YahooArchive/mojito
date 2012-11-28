/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('ExecuteCommand', function(Y, NAME) {

/**
 * The ExecuteCommand module.
 *
 * @module ExecuteCommand
 */

    /**
     * Constructor for the Controller class.
     *
     * @class Controller
     * @constructor
     */
    Y.namespace('mojito.controllers')[NAME] = {

        /**
         * Method corresponding to the 'index' action.
         *
         * @param ac {Object} The action context that provides access
         *        to the Mojito API.
         */
        runCommand: function(ac) {
            var commandKey = ac.params.getFromBody("cmdKey");
			var commands = ac.config.get("commands." + commandKey + ".cmd");
			Y.log("These are the commands: ", 'INFO', NAME);
			Y.log(commands);
			var cmdToExecute = "";
			Y.Array.each(commands, function(eachCmd){
				cmdToExecute += eachCmd + ";";
			});
			Y.log("Final Command: " + cmdToExecute);
			var exec = require('child_process').exec;
			child = exec(cmdToExecute, function (error, stdout, stderr) {
	        	response = stdout;
	        	errorStr = stderr;
	        	  //Y.log('This is the stderr: ' + stderr, "INFO");
	        	if (error !== null) {
	        	    Y.log('exec error: ' + error);
	        	}
				var cmdOutput = {cmdOut: response};
	        	ac.done(cmdOutput);
	        });
        }
    };
}, '0.0.1', {requires: ['mojito', 'mojito-params-addon', 'mojito-config-addon']});

/*
* Copyright (c) 2011 Yahoo! Inc. All rights reserved.
*/
YUI.add('SimpleModel', function(Y, NAME) {

    Y.namespace('mojito.controllers')[NAME] = {

        index: function(ac) {
            ac.done();
        },

        simpleModel: function(ac){
            ac.models.SimpleModel.getTurkeyImages(function(turkeys) {
                //ac.http.setHeader('content-type', 'text/html');
                ac.done({turkeys: turkeys});
            });	
		},
		
		rpcModel: function(ac){
		    ac.error(new Error("something is not right"));
            ac.done();
		},
		
		configModel: function(ac){
            ac.models.SimpleModel.getConfigFromModel(function(myconfig) {
                ac.done({myconfig: myconfig});
           });	
		}
        
    };
    
}, '0.0.1', {requires: ['mojito']});

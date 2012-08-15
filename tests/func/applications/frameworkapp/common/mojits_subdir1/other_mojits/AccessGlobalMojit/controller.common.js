/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('AccessGlobalMojit', function(Y) {

    Y.mojito.controller = {

        init: function(config) {
            this.config = config;
        },

        accessModel: function(ac) {
			ac.models.GlobalMojit.myGlobalModelFunction(function(data) {
				Y.log(data.some, "info");
			});
			ac.models.Binders.getTaco(function(data) {
				Y.log(data.message, "info");
			});
			
			Y.log("******************************" + ac.mytest.myAddonFunction(), "info");
            ac.done("I am done");
        }

    };

}, '0.0.1', {requires: ['GlobalMojitModel', 'mojito-mytest-addon', 'BindersModel']});

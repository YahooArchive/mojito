YUI.add("routing-tests", function(Y, NAME) {
    Y.namespace('martini.controller')[NAME] = {
        
        basicRoutingTest: function(tc) {
            var wd = tc.selenium.getWebDriverJSModule();
            var browser = tc.selenium.getBrowser();
            var self = this;
            
            // scenario
            browser.get(tc.makeAppUrl("/route-1/index"));
            
            // validation
            var p = browser.findElement(wd.By.xpath("/html/body/p"));
            p.then(function(ele) {
				util.log("This is the element: " + ele);
                ele.getText().then(function(text) {
                    self.resume(function() {
                        tc.assert.areEqual("This is a simple mojit for testing routing - SimpleRoute (route-1)", text);
                    });
                });
            }, function(err) { YUITest.Assert.fail("can't find an element at /html/body/p"); });
            
            this.wait(tc.maxUIWaitTimeOut());
			//this.wait(10000);
        }
    };
}, "0.0.1", {requires: []});

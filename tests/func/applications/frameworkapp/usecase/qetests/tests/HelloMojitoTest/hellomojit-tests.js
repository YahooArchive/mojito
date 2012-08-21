YUI.add("hellomojit-tests", function(Y, NAME) {
    Y.namespace('martini.controller')[NAME] = {
        
        testHelloMojit: function(tc) {
            var wd = tc.selenium.getWebDriverJSModule();
            var browser = tc.selenium.getBrowser();
            var self = this;
            
            // scenario
            browser.get(tc.makeAppUrl("/hello-1/index"));
            
            // validation
            var p = browser.findElement(wd.By.xpath("/html/body/pre"));
            p.then(function(ele) {
                ele.getText().then(function(text) {
                    self.resume(function() {
                        tc.assert.areEqual("Mojito is working.", text);
                    });
                });
            }, function(err) { YUITest.Assert.fail("can't find an element"); });
            
            this.wait(tc.maxUIWaitTimeOut());
        }
    };
}, "0.0.1", {requires: []});


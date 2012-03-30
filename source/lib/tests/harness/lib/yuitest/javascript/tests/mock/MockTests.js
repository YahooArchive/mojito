(function(){
    
    var Assert          = YUITest.Assert,
        ObjectAssert    = YUITest.ObjectAssert;
    
    //-------------------------------------------------------------------------
    // Base Test Suite
    //-------------------------------------------------------------------------
    
    var suite = new YUITest.TestSuite("Mock Tests");
    
    //-------------------------------------------------------------------------
    // Test Case for call count
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name : "Call Count Tests",
        
        _should: {
            fail: {
                "Call count should default to 1 and fail": 1,
                "Call count set to 1 should fail when method isn't called": 1,
                "Call count set to 1 should fail when method is called twice": 1,
                "Call count set to 0 should fail when method is called once": 1
            }
        },

        /*
         * Tests that leaving off callCount results in a callCount of 1, so
         * calling the mock method once should make the test pass.
         */
        "Call count should default to 1 and pass": function(){
        
            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method"                    
            });
            
            mock.method();                
            YUITest.Mock.verify(mock);            
        },
        
        /*
         * Tests that leaving off callCount results in a callCount of 1, so
         * not calling the mock method once should make the test fail.
         */
        "Call count should default to 1 and fail": function(){
        
            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method"                    
            });
            
            YUITest.Mock.verify(mock);            
        },
        
        /*
         * Tests that setting callCount to 1 and
         * calling the mock method once should make the test pass.
         */
        "Call count set to 1 should pass when method is called once": function(){
        
            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                callCount: 1
            });
            
            mock.method();                
            YUITest.Mock.verify(mock);            
        },
        
        /*
         * Tests that setting callCount to 1 and not
         * calling the mock method once should make the test fail.
         */
        "Call count set to 1 should fail when method isn't called": function(){
        
            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                callCount: 1                    
            });
            
            YUITest.Mock.verify(mock);            
        },
                    
        /*
         * Tests that setting callCount to 1 and not
         * calling the mock method twice should make the test fail.
         */
        "Call count set to 1 should fail when method is called twice": function(){
        
            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                callCount: 1                    
            });
            
            mock.method();
            mock.method();
            
            YUITest.Mock.verify(mock);            
        },
                    
        /*
         * Tests that setting callCount to 0 and
         * calling the mock method once should make the test fail.
         */
        "Call count set to 0 should fail when method is called once": function(){
        
            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                callCount: 0
            });
            
            mock.method();                
            YUITest.Mock.verify(mock);            
        },
        
        /*
         * Tests that setting callCount to 0 and not
         * calling the mock method once should make the test pass.
         */
        "Call count set to 0 should pass when method isn't called": function(){
        
            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                callCount: 0                    
            });
            
            YUITest.Mock.verify(mock);            
        }        

    }));
    
    //-------------------------------------------------------------------------
    // Test Case for arguments
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name : "Arguments Tests",
        
        _should: {
            fail: {
                "Passing an incorrect number of arguments should make the test fail": 1,
                "Passing an inexact argument should make the test fail" : 1,
                
                "Passing a number to an Boolean argument should make the test fail": 1,
                "Passing a string to an Boolean argument should make the test fail": 1,
                "Passing a object to an Boolean argument should make the test fail": 1,
                "Passing a function to an Boolean argument should make the test fail": 1,
                "Passing a null to an Boolean argument should make the test fail": 1,
                
                "Passing a number to an String argument should make the test fail": 1,
                "Passing a boolean to an String argument should make the test fail": 1,
                "Passing a object to an String argument should make the test fail": 1,
                "Passing a function to an String argument should make the test fail": 1,
                "Passing a null to an String argument should make the test fail": 1,
                
                "Passing a string to an Number argument should make the test fail": 1,
                "Passing a boolean to an Number argument should make the test fail": 1,
                "Passing a object to an Number argument should make the test fail": 1,
                "Passing a function to an Number argument should make the test fail": 1,
                "Passing a null to an Number argument should make the test fail": 1,
                
                "Passing a string to an Object argument should make the test fail": 1,
                "Passing a boolean to an Object argument should make the test fail": 1,
                "Passing a number to an Object argument should make the test fail": 1,
                "Passing a null to an Object argument should make the test fail": 1,
                
                "Passing a string to an Function argument should make the test fail": 1,
                "Passing a boolean to an Function argument should make the test fail": 1,
                "Passing a number to an Function argument should make the test fail": 1,
                "Passing a object to an Function argument should make the test fail": 1,
                "Passing a null to an Function argument should make the test fail": 1
                
                
            }
        },

        /*
         * Tests that when the number of arguments is verified, the test passes.
         */
        "Passing correct number of arguments should make the test pass": function(){
        
            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Any ]
            });
            
            mock.method(1);                
            YUITest.Mock.verify(mock);            
        },
        
        /*
         * Tests that when the number of arguments is not verified, the test fails.
         */
        "Passing an incorrect number of arguments should make the test fail": function(){
        
            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Any ]
            });
            
            mock.method(1, 2);                
            YUITest.Mock.verify(mock);            
        },
        
        /*
         * Tests that passing the exactly specified argument causes the test to pass.
         */
        "Passing the exact argument should make the test pass": function(){
        
            var arg = {};
            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ arg ]
            });
            
            mock.method(arg);                
            YUITest.Mock.verify(mock);            
        },
        
        /*
         * Tests that passing an argument that isn't exactly specified argument causes the test to fail.
         */
        "Passing an inexact argument should make the test fail": function(){
        
            var arg = {};
            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ arg ]
            });
            
            mock.method({});                
            YUITest.Mock.verify(mock);            
        },

        //YUITest.Mock.Value.Any tests --------------------------------------
        
        /*
         * Tests that passing a number to an argument specified as YUITest.Mock.Value.Any
         * results cause the test to pass.
         */
        "Passing a number to an Any argument should make the test pass": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Any ]
            });
            
            mock.method(1);                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a boolean to an argument specified as YUITest.Mock.Value.Any
         * results cause the test to pass.
         */
        "Passing a boolean to an Any argument should make the test pass": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Any ]
            });
            
            mock.method(true);                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a string to an argument specified as YUITest.Mock.Value.Any
         * results cause the test to pass.
         */
        "Passing a string to an Any argument should make the test pass": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Any ]
            });
            
            mock.method("");                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing an object to an argument specified as YUITest.Mock.Value.Any
         * results cause the test to pass.
         */
        "Passing a object to an Any argument should make the test pass": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Any ]
            });
            
            mock.method({});                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a function to an argument specified as YUITest.Mock.Value.Any
         * results cause the test to pass.
         */
        "Passing a function to an Any argument should make the test pass": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Any ]
            });
            
            mock.method(function(){});                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a null to an argument specified as YUITest.Mock.Value.Any
         * results cause the test to pass.
         */
        "Passing a null to an Any argument should make the test pass": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Any ]
            });
            
            mock.method(null);                
            YUITest.Mock.verify(mock);            
        },

        //YUITest.Mock.Value.Boolean tests --------------------------------------
        
        /*
         * Tests that passing a number to an argument specified as YUITest.Mock.Value.Boolean
         * results cause the test to fail.
         */
        "Passing a number to an Boolean argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Boolean ]
            });
            
            mock.method(1);                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a boolean to an argument specified as YUITest.Mock.Value.Boolean
         * results cause the test to pass.
         */
        "Passing a boolean to an Boolean argument should make the test pass": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Boolean ]
            });
            
            mock.method(true);                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a string to an argument specified as YUITest.Mock.Value.Boolean
         * results cause the test to fail.
         */
        "Passing a string to an Boolean argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Boolean ]
            });
            
            mock.method("");                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing an object to an argument specified as YUITest.Mock.Value.Boolean
         * results cause the test to fail.
         */
        "Passing a object to an Boolean argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Boolean ]
            });
            
            mock.method({});                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a function to an argument specified as YUITest.Mock.Value.Boolean
         * results cause the test to fail.
         */
        "Passing a function to an Boolean argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Boolean ]
            });
            
            mock.method(function(){});                
            YUITest.Mock.verify(mock);            
        },            
        
        /*
         * Tests that passing a null to an argument specified as YUITest.Mock.Value.Boolean
         * results cause the test to fail.
         */
        "Passing a null to an Boolean argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Boolean ]
            });
            
            mock.method(null);                
            YUITest.Mock.verify(mock);            
        },            
        
        //YUITest.Mock.Value.String tests --------------------------------------
        
        /*
         * Tests that passing a number to an argument specified as YUITest.Mock.Value.String
         * results cause the test to fail.
         */
        "Passing a number to an String argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.String ]
            });
            
            mock.method(1);                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a boolean to an argument specified as YUITest.Mock.Value.String
         * results cause the test to fail.
         */
        "Passing a boolean to an String argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.String ]
            });
            
            mock.method(true);                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a string to an argument specified as YUITest.Mock.Value.String
         * results cause the test to pass.
         */
        "Passing a string to an String argument should make the test pass": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.String ]
            });
            
            mock.method("");                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing an object to an argument specified as YUITest.Mock.Value.String
         * results cause the test to fail.
         */
        "Passing a object to an String argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.String ]
            });
            
            mock.method({});                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a function to an argument specified as YUITest.Mock.Value.String
         * results cause the test to fail.
         */
        "Passing a function to an String argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.String ]
            });
            
            mock.method(function(){});                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a null to an argument specified as YUITest.Mock.Value.String
         * results cause the test to fail.
         */
        "Passing a null to an String argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.String ]
            });
            
            mock.method(null);                
            YUITest.Mock.verify(mock);            
        }, 

        //YUITest.Mock.Value.Number tests --------------------------------------
        
        /*
         * Tests that passing a number to an argument specified as YUITest.Mock.Value.Number
         * results cause the test to pass.
         */
        "Passing a number to an Number argument should make the test pass": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Number ]
            });
            
            mock.method(1);                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a boolean to an argument specified as YUITest.Mock.Value.Number
         * results cause the test to fail.
         */
        "Passing a boolean to an Number argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Number ]
            });
            
            mock.method(true);                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a string to an argument specified as YUITest.Mock.Value.Number
         * results cause the test to fail.
         */
        "Passing a string to an Number argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Number ]
            });
            
            mock.method("");                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing an object to an argument specified as YUITest.Mock.Value.Number
         * results cause the test to fail.
         */
        "Passing a object to an Number argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Number ]
            });
            
            mock.method({});                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a function to an argument specified as YUITest.Mock.Value.Number
         * results cause the test to fail.
         */
        "Passing a function to an Number argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Number ]
            });
            
            mock.method(function(){});                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a null to an argument specified as YUITest.Mock.Value.Number
         * results cause the test to fail.
         */
        "Passing a null to an Number argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Number ]
            });
            
            mock.method(null);                
            YUITest.Mock.verify(mock);            
        },          
              
        //YUITest.Mock.Value.Function tests --------------------------------------
        
        /*
         * Tests that passing a number to an argument specified as YUITest.Mock.Value.Function
         * results cause the test to fail.
         */
        "Passing a number to an Function argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Function ]
            });
            
            mock.method(1);                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a boolean to an argument specified as YUITest.Mock.Value.Function
         * results cause the test to fail.
         */
        "Passing a boolean to an Function argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Function ]
            });
            
            mock.method(true);                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a string to an argument specified as YUITest.Mock.Value.Function
         * results cause the test to fail.
         */
        "Passing a string to an Function argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Function ]
            });
            
            mock.method("");                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing an object to an argument specified as YUITest.Mock.Value.Function
         * results cause the test to fail.
         */
        "Passing a object to an Function argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Function ]
            });
            
            mock.method({});                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a function to an argument specified as YUITest.Mock.Value.Function
         * results cause the test to pass.
         */
        "Passing a function to an Function argument should make the test pass": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Function ]
            });
            
            mock.method(function(){});                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a null to an argument specified as YUITest.Mock.Value.Function
         * results cause the test to fail.
         */
        "Passing a null to an Function argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Function ]
            });
            
            mock.method(null);                
            YUITest.Mock.verify(mock);            
        },          

        //YUITest.Mock.Value.Object tests --------------------------------------
        
        /*
         * Tests that passing a number to an argument specified as YUITest.Mock.Value.Object
         * results cause the test to fail.
         */
        "Passing a number to an Object argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Object ]
            });
            
            mock.method(1);                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a boolean to an argument specified as YUITest.Mock.Value.Object
         * results cause the test to fail.
         */
        "Passing a boolean to an Object argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Object ]
            });
            
            mock.method(true);                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a string to an argument specified as YUITest.Mock.Value.Object
         * results cause the test to fail.
         */
        "Passing a string to an Object argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Object ]
            });
            
            mock.method("");                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing an object to an argument specified as YUITest.Mock.Value.Object
         * results cause the test to pass.
         */
        "Passing a object to an Object argument should make the test pass": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Object ]
            });
            
            mock.method({});                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a function to an argument specified as YUITest.Mock.Value.Object
         * results cause the test to pass.
         */
        "Passing a function to an Object argument should make the test pass": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Object ]
            });
            
            mock.method(function(){});                
            YUITest.Mock.verify(mock);            
        },

        /*
         * Tests that passing a null to an argument specified as YUITest.Mock.Value.Object
         * results cause the test to fail.
         */
        "Passing a null to an Object argument should make the test fail": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.Object ]
            });
            
            mock.method(null);                
            YUITest.Mock.verify(mock);            
        }   
    }));          
    
    //-------------------------------------------------------------------------
    // Test Case for asynchronous mock calls
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name : "Asynchronous Tests",
        
        _should: {
        
            fail: {
                "A mock method called asynchronously shouldn't cause an error": 1
            }
        },
        
        /*
         * Tests that when a mock method is called asynchronously, either via
         * timeout or XHR callback, that its error is properly handled and
         * the failure is logged to the test.
         */
        "A mock method called asynchronously shouldn't cause an error": function(){

            var mock = YUITest.Mock();
            YUITest.Mock.expect(mock, {
                method: "method",
                args: [ YUITest.Mock.Value.String ]
            });
            
            setTimeout(function(){
                mock.method(null);    
            }, 250);
            
            this.wait(function(){
                YUITest.Mock.verify(mock); 
            }, 500);
        }
        
    }));
     

    YUITest.TestRunner.add(suite);

})();
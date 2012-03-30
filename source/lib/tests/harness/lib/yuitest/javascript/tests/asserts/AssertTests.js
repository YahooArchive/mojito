(function(){

    var Assert          = YUITest.Assert;
    
    //-------------------------------------------------------------------------
    // Base Test Suite
    //-------------------------------------------------------------------------
    
    var suite = new YUITest.TestSuite("Assert Tests");
    
    //-------------------------------------------------------------------------
    // Test Case for throwsError()
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "throwsError Assert Tests",

        "throwsError() should pass when an error with the given message is thrown": function(){
            Assert.throwsError("Something bad happened.", function(){
                throw new Error("Something bad happened.");
            });        
        },
        
        "throwsError() should fail when an error is not thrown": function(){
            Assert.throwsError(YUITest.AssertionError, function(){
                Assert.throwsError("Something bad happened.", function(){
                    //noop
                });        
            });
        },
        
        "throwsError() should fail when an error with a different message is thrown": function(){
            Assert.throwsError(YUITest.AssertionError, function(){
                Assert.throwsError("Something bad happened.", function(){
                    throw new Error("Something else happened.");
                });        
            });
        },
        
        "throwsError() should throw a custom message when failing": function(){
            Assert.throwsError(YUITest.AssertionError, function(){
                Assert.throwsError("The type of error is incorrect.", function(){
                    Assert.throwsError("Something bad happened.", function(){
                        throw new Error("Something else happened.");
                    }, "The type of error is incorrect.");        
                });
            });
        },
        
        "throwsError() should pass when an error with the given constructor is thrown": function(){            
            Assert.throwsError(SyntaxError, function(){
                throw new SyntaxError("Something bad happened.");
            });        
        },
        
        "throwsError() should fail when an error with a different constructor is thrown": function(){
            Assert.throwsError(YUITest.AssertionError, function(){
                Assert.throwsError(SyntaxError, function(){
                    throw new Error("Something else happened.");
                });        
            });
        },
        
        "throwsError() should pass when an error with the given constructor and message is thrown": function(){            
            Assert.throwsError(new SyntaxError("Something bad happened."), function(){
                throw new SyntaxError("Something bad happened.");
            });        
        },
        
        "throwsError() should fail when an error with a different constructor but same message is thrown": function(){
            Assert.throwsError(YUITest.AssertionError, function(){
                Assert.throwsError(new SyntaxError("Something bad happened."), function(){
                    throw new Error("Something bad happened.");
                });        
            });
        },
        
        "throwsError() should fail when an error with the given constructor but a different message is thrown": function(){
            Assert.throwsError(YUITest.AssertionError, function(){
                Assert.throwsError(new Error("Something else happened."), function(){
                    throw new Error("Something bad happened.");
                });        
            });
        }        
    }));            
    
    //-------------------------------------------------------------------------
    // Test Case for fail()
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "fail Assert Tests",

        "fail() should throw an assertion error with the given message": function(){
            Assert.throwsError(new YUITest.AssertionError("Something bad happened."), function(){
                Assert.fail("Something bad happened.");
            });        
        }
    }));
     
    //-------------------------------------------------------------------------
    // Test Case for areEqual()
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "areEqual() Assert Tests",

        "areEqual() should pass when values are identical": function(){
            Assert.areEqual(5, 5);        
        },
        
        "areEqual() should pass when values are similar": function(){
            Assert.areEqual(5, "5");        
        },
        
        "areEqual() should fail when values are not similar": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.areEqual(5, 6);        
            });
        },
        
        "areEqual() should throw a custom message when failing": function(){
            Assert.throwsError(new YUITest.ComparisonFailure("Something bad happened."), function(){
                Assert.areEqual(5, 6, "Something bad happened.");
            });
        }      
    }));
     
    //-------------------------------------------------------------------------
    // Test Case for areNotEqual()
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "areNotEqual() Assert Tests",

        "areNotEqual() should fail when values are identical": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.areNotEqual(5, 5);        
            });
        },
        
        "areNotEqual() should fail when values are similar": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.areNotEqual(5, "5");        
            });
        },
        
        "areNotEqual() should pass when values are not similar": function(){
            Assert.areNotEqual(5, 6);        
        },
        
        "areNotEqual() should throw a custom message when failing": function(){
            Assert.throwsError(new YUITest.UnexpectedValue("Something bad happened."), function(){
                Assert.areNotEqual(5, 5, "Something bad happened.");
            });
        }  
    }));
     
    //-------------------------------------------------------------------------
    // Test Case for areSame()
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "areSame() Assert Tests",

        "areSame() should pass when values are identical": function(){
            Assert.areSame(5, 5);        
        },
        
        "areSame() should fail when values are similar": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.areSame(5, "5");        
            });
        },
        
        "areSame() should fail when values are not similar": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.areSame(5, 6);        
            });
        },
        
        "areSame() should throw a custom message when failing": function(){
            Assert.throwsError(new YUITest.ComparisonFailure("Something bad happened."), function(){
                Assert.areSame(5, 6, "Something bad happened.");
            });
        }  
    }));
     
    //-------------------------------------------------------------------------
    // Test Case for areNotSame()
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "areNotSame() Assert Tests",

        "areNotSame() should fail when values are identical": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.areNotSame(5, 5);        
            });
        },
        
        "areNotSame() should pass when values are similar": function(){
            Assert.areNotSame(5, "5");        
        },
        
        "areNotSame() should pass when values are not similar": function(){
            Assert.areNotSame(5, 6);        
        },
        
        "areNotSame() should throw a custom message when failing": function(){
            Assert.throwsError(new YUITest.UnexpectedValue("Something bad happened."), function(){
                Assert.areNotSame(5, 5, "Something bad happened.");
            });
        }  
    }));
         
    //-------------------------------------------------------------------------
    // Test Case for isTrue() assertions
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "isTrue() Assert Tests",

        "isTrue() should pass for true value": function(){
            Assert.isTrue(true);
        },
        
        "isTrue() should fail for truthy non-true values": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTrue(1);
            });
        },
        
        "isTrue() should fail for false value": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTrue(false);
            });
        },
        
        "isTrue() should fail for falsy non-false values": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTrue(0);
            });
        },
        
        "isTrue() should fail for non-empty string values": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTrue("hello");
            });
        },
        
        "isTrue() should fail for empty string values": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTrue("");
            });
        },                
        
        "isTrue() should throw a custom message when failing": function(){
            Assert.throwsError(new YUITest.ComparisonFailure("Something bad happened."), function(){
                Assert.isTrue(0, "Something bad happened.");
            });
        }  
    }));
         
    //-------------------------------------------------------------------------
    // Test Case for isFalse() assertions
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "isFalse() Assert Tests",

        "isFalse() should pass for false value": function(){
            Assert.isFalse(false);
        },
        
        "isFalse() should fail for falsy non-false values": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isFalse(0);
            });
        },
        
        "isFalse() should fail for true value": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isFalse(true);
            });
        },
        
        "isFalse() should fail for truthy non-true values": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isFalse(1);
            });
        },
        
        "isFalse() should fail for non-empty string values": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isFalse("hello");
            });
        },
        
        "isFalse() should fail for empty string values": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isFalse("");
            });
        },
        
        "isFalse() should throw a custom message when failing": function(){
            Assert.throwsError(new YUITest.ComparisonFailure("Something bad happened."), function(){
                Assert.isFalse(true, "Something bad happened.");
            });
        }          
    }));
    
    //-------------------------------------------------------------------------
    // Test Case for isNaN() assertions
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "isNaN() Assert Tests",

        "isNaN() should pass for NaN value": function(){
            Assert.isNaN(NaN);
        },
        
        "isNaN() should pass for non-numeric string value": function(){
            Assert.isNaN("5x");
        },
        
        "isNaN() should pass for undefined value": function(){
            Assert.isNaN(undefined);
        },
        
        "isNaN() should fail for non-NaN numbers": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isNaN(0);
            });
        },
        
        "isNaN() should fail for true value": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isNaN(true);
            });
        },
        
        "isNaN() should fail for false value": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isNaN(false);
            });
        },
        
        "isNaN() should fail for null value": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isNaN(null);
            });
        },
        
        "isNaN() should fail for numeric string value": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isNaN("5");
            });
        },
        
        "isNaN() should fail for empty string value": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isNaN("");
            });
        },
        
        "isNaN() should throw a custom message when failing": function(){
            Assert.throwsError(new YUITest.ComparisonFailure("Something bad happened."), function(){
                Assert.isNaN(0, "Something bad happened.");
            });
        }          
    }));    

    //-------------------------------------------------------------------------
    // Test Case for isNotNaN() assertions
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "isNotNaN() Assert Tests",
        
        "isNotNaN() should pass for non-NaN numbers": function(){
            Assert.isNotNaN(0);
        },
        
        "isNotNaN() should pass for true value": function(){
            Assert.isNotNaN(true);
        },
        
        "isNotNaN() should pass for false value": function(){
            Assert.isNotNaN(false);
        },
        
        "isNotNaN() should pass for null value": function(){
            Assert.isNotNaN(null);
        },
        
        "isNotNaN() should pass for numeric string values": function(){
            Assert.isNotNaN("5");
        },
        
        "isNotNaN() should fail for NaN value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isNotNaN(NaN);
            });
        },
        
        "isNotNaN() should fail for non-numeric string value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isNotNaN("5x");
            });
        },
        
        "isNotNaN() should pass for empty string value": function(){
            Assert.isNotNaN("");
        },
        
        "isNotNaN() should fail for undefined value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isNotNaN(undefined);
            });
        },        
        
        "isNotNaN() should fail a custom message when failing": function(){
            Assert.throwsError(new YUITest.UnexpectedValue("Something bad happened."), function(){
                Assert.isNotNaN(NaN, "Something bad happened.");
            });
        }          
    }));        
    
    //-------------------------------------------------------------------------
    // Test Case for isNull() assertions
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "isNull() Assert Tests",

        "isNull() should pass for null value": function(){
            Assert.isNull(null);
        },
                
        "isNull() should fail for zero numbers": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isNull(0);
            });
        },
        
        "isNull() should fail for non-zero numbers": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isNull(10);
            });
        },
        
        "isNull() should fail for true value": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isNull(true);
            });
        },
        
        "isNull() should fail for false value": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isNull(false);
            });
        },
        
        "isNull() should fail for undefined value": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isNull(undefined);
            });
        },
        
        "isNull() should fail for non-empty string value": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isNull("hello");
            });
        },
        
        "isNull() should fail for empty string values": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isNull("");
            });
        },
        
        "isNull() should throw a custom message when failing": function(){
            Assert.throwsError(new YUITest.ComparisonFailure("Something bad happened."), function(){
                Assert.isNull(0, "Something bad happened.");
            });
        }          
    }));    
    
    //-------------------------------------------------------------------------
    // Test Case for isNotNull() assertions
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "isNotNull() Assert Tests",

        "isNotNull() should pass for zero numbers": function(){
            Assert.isNotNull(0);
        },
        
        "isNotNull() should pass for non-zero numbers": function(){
            Assert.isNotNull(10);
        },
        
        "isNotNull() should pass for true value": function(){
            Assert.isNotNull(true);
        },
        
        "isNotNull() should pass for false value": function(){
            Assert.isNotNull(false);
        },
        
        "isNotNull() should pass for undefined value": function(){
            Assert.isNotNull(undefined);
        },
        
        "isNotNull() should pass for non-empty string value": function(){
            Assert.isNotNull("hello");
        },
        
        "isNotNull() should pass for empty string value": function(){
            Assert.isNotNull("");
        },
        
        "isNotNull() should fail for null value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isNotNull(null);
            });
        },
                
        "isNotNull() should throw a custom message when failing": function(){
            Assert.throwsError(new YUITest.UnexpectedValue("Something bad happened."), function(){
                Assert.isNotNull(null, "Something bad happened.");
            });
        }          
    }));    
    
    //-------------------------------------------------------------------------
    // Test Case for isUndefined() assertions
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "isUndefined() Assert Tests",

        "isUndefined() should pass for undefined value": function(){
            Assert.isUndefined(undefined);
        },
                
        "isUndefined() should fail for zero numbers": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isUndefined(0);
            });
        },
        
        "isUndefined() should fail for non-zero numbers": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isUndefined(10);
            });
        },
        
        "isUndefined() should fail for true value": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isUndefined(true);
            });
        },
        
        "isUndefined() should fail for false value": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isUndefined(false);
            });
        },
        
        "isUndefined() should fail for null value": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isUndefined(null);
            });
        },
        
        "isUndefined() should fail for non-empty string value": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isUndefined("hello");
            });
        },
        
        "isUndefined() should fail for empty string value": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isUndefined("");
            });
        },
        
        "isUndefined() should throw a custom message when failing": function(){
            Assert.throwsError(new YUITest.ComparisonFailure("Something bad happened."), function(){
                Assert.isUndefined(0, "Something bad happened.");
            });
        }          
    }));    
    
    //-------------------------------------------------------------------------
    // Test Case for isNotUndefined() assertions
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "isNotUndefined() Assert Tests",

        "isNotUndefined() should pass for zero numbers": function(){
            Assert.isNotUndefined(0);
        },
        
        "isNotUndefined() should pass for non-zero numbers": function(){
            Assert.isNotUndefined(10);
        },
        
        "isNotUndefined() should pass for true value": function(){
            Assert.isNotUndefined(true);
        },
        
        "isNotUndefined() should pass for false value": function(){
            Assert.isNotUndefined(false);
        },
        
        "isNotUndefined() should pass for null value": function(){
            Assert.isNotUndefined(null);
        },
        
        "isNotUndefined() should pass for non-empty string value": function(){
            Assert.isNotUndefined("hello");
        },
        
        "isNotUndefined() should pass for empty string value": function(){
            Assert.isNotUndefined("");
        },
        
        "isNotUndefined() should fail for undefined value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isNotUndefined(undefined);
            });
        },
                
        "isNotUndefined() should throw a custom message when failing": function(){
            Assert.throwsError(new YUITest.UnexpectedValue("Something bad happened."), function(){
                Assert.isNotUndefined(undefined, "Something bad happened.");
            });
        }          
    }));        
    
    //-------------------------------------------------------------------------
    // Test Case for isArray() assertions
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "isArray() Assert Tests",

        "isArray() should pass for array value": function(){
            Assert.isArray([]);
        },
                
        "isArray() should fail for array-like objects": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isArray(arguments);
            });
        },
        
        "isArray() should fail for zero numbers": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isArray(0);
            });
        },
        
        "isArray() should fail for non-zero numbers": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isArray(10);
            });
        },
        
        "isArray() should fail for true value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isArray(true);
            });
        },
        
        "isArray() should fail for false value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isArray(false);
            });
        },
        
        "isArray() should fail for null value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isArray(null);
            });
        },
        
        "isArray() should fail for undefined value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isArray(undefined);
            });
        },
        
        "isArray() should fail for non-empty string value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isArray("hello");
            });
        },
        
        "isArray() should fail for empty string value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isArray("");
            });
        },
        
        "isArray() should throw a custom message when failing": function(){
            Assert.throwsError(new YUITest.UnexpectedValue("Something bad happened."), function(){
                Assert.isArray(0, "Something bad happened.");
            });
        }          
    }));        
    
    //-------------------------------------------------------------------------
    // Test Case for isBoolean() assertions
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "isBoolean() Assert Tests",

        "isBoolean() should pass for true value": function(){
            Assert.isBoolean(true);
        },
                
        "isBoolean() should pass for false value": function(){
            Assert.isBoolean(false);
        },
                               
        "isBoolean() should fail for objects": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isBoolean({});
            });
        },
        
        "isBoolean() should fail for zero numbers": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isBoolean(0);
            });
        },
        
        "isBoolean() should fail for non-zero numbers": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isBoolean(10);
            });
        },
        
        "isBoolean() should fail for Boolean object value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isBoolean(new Boolean(true));
            });
        },
        
        "isBoolean() should fail for null value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isBoolean(null);
            });
        },
        
        "isBoolean() should fail for undefined value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isBoolean(undefined);
            });
        },
        
        "isBoolean() should fail for non-empty string value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isBoolean("hello");
            });
        },
        
        "isBoolean() should fail for empty string value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isBoolean("");
            });
        },
        
        "isBoolean() should throw a custom message when failing": function(){
            Assert.throwsError(new YUITest.UnexpectedValue("Something bad happened."), function(){
                Assert.isBoolean(0, "Something bad happened.");
            });
        }          
    }));            
    

    //-------------------------------------------------------------------------
    // Test Case for isFunction() assertions
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "isFunction() Assert Tests",

        "isFunction() should pass for function value": function(){
            Assert.isFunction(new Function());
        },
                
        "isFunction() should fail for objects": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isFunction({});
            });
        },
        
        "isFunction() should fail for zero numbers": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isFunction(0);
            });
        },
        
        "isFunction() should fail for non-zero numbers": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isFunction(10);
            });
        },
        
        "isFunction() should fail for true value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isFunction(true);
            });
        },
        
        "isFunction() should fail for false value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isFunction(false);
            });
        },
        
        "isFunction() should fail for null value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isFunction(null);
            });
        },
        
        "isFunction() should fail for undefined value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isFunction(undefined);
            });
        },
        
        "isFunction() should fail for non-empty string value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isFunction("hello");
            });
        },
        
        "isFunction() should fail for empty string value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isFunction("");
            });
        },
        
        "isFunction() should throw a custom message when failing": function(){
            Assert.throwsError(new YUITest.UnexpectedValue("Something bad happened."), function(){
                Assert.isFunction(0, "Something bad happened.");
            });
        }          
    }));        
        

    //-------------------------------------------------------------------------
    // Test Case for isNumber() assertions
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "isNumber() Assert Tests",

        "isNumber() should pass for zero numbers": function(){
            Assert.isNumber(0);
        },
        
        "isNumber() should pass for non-zero numbers": function(){
            Assert.isNumber(10);
        },

        "isNumber() should pass for NaN": function(){
            Assert.isNumber(NaN);
        },

                
        "isNumber() should fail for objects": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isNumber({});
            });
        },
        
        "isNumber() should fail for true value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isNumber(true);
            });
        },
        
        "isNumber() should fail for false value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isNumber(false);
            });
        },
        
        "isNumber() should fail for null value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isNumber(null);
            });
        },
        
        "isNumber() should fail for undefined value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isNumber(undefined);
            });
        },
        
        "isNumber() should fail for non-empty string value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isNumber("hello");
            });
        },
        
        "isNumber() should fail for empty string value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isNumber("");
            });
        },
        
        "isNumber() should throw a custom message when failing": function(){
            Assert.throwsError(new YUITest.UnexpectedValue("Something bad happened."), function(){
                Assert.isNumber(null, "Something bad happened.");
            });
        }          
    }));        
        

    //-------------------------------------------------------------------------
    // Test Case for isString() assertions
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "isString() Assert Tests",

        
        "isString() should pass for non-empty string value": function(){
            Assert.isString("hello");
        },
        
        "isString() should pass for empty string value": function(){
            Assert.isString("");
        },
                
        "isString() should fail for objects": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isString({});
            });
        },
        
        "isString() should fail for zero numbers": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isString(0);
            });
        },
        
        "isString() should fail for non-zero numbers": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isString(10);
            });
        },
        
        "isString() should fail for true value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isString(true);
            });
        },
        
        "isString() should fail for false value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isString(false);
            });
        },
        
        "isString() should fail for null value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isString(null);
            });
        },
        
        "isString() should fail for undefined value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isString(undefined);
            });
        },
        
        "isString() should throw a custom message when failing": function(){
            Assert.throwsError(new YUITest.UnexpectedValue("Something bad happened."), function(){
                Assert.isString(0, "Something bad happened.");
            });
        }          
    }));        
            

    //-------------------------------------------------------------------------
    // Test Case for isObject() assertions
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "isObject() Assert Tests",

        "isObject() should pass for array value": function(){
            Assert.isObject([]);
        },
                
        "isObject() should pass for object value": function(){
            Assert.isObject({});
        },

        "isObject() should pass for global object": function(){
            Assert.isObject(self);
        },

        "isObject() should fail for zero numbers": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isObject(0);
            });
        },
        
        "isObject() should fail for non-zero numbers": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isObject(10);
            });
        },
        
        "isObject() should fail for true value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isObject(true);
            });
        },
        
        "isObject() should fail for false value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isObject(false);
            });
        },
        
        "isObject() should fail for null value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isObject(null);
            });
        },
        
        "isObject() should fail for undefined value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isObject(undefined);
            });
        },
        
        "isObject() should fail for non-empty string value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isObject("hello");
            });
        },
        
        "isObject() should fail for empty string value": function(){
            Assert.throwsError(YUITest.UnexpectedValue, function(){
                Assert.isObject("");
            });
        },
        
        "isObject() should throw a custom message when failing": function(){
            Assert.throwsError(new YUITest.UnexpectedValue("Something bad happened."), function(){
                Assert.isObject(0, "Something bad happened.");
            });
        }          
    }));        
    

    //-------------------------------------------------------------------------
    // Test Case for isTypeOf() assertions
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "isTypeOf() Assert Tests",

        "isTypeOf() should pass for empty string value as string type": function(){
            Assert.isTypeOf("string", "");
        },
                
        "isTypeOf() should pass for non-empty string value as string type": function(){
            Assert.isTypeOf("string", "foo");
        },
                
        "isTypeOf() should pass for object value as object type": function(){
            Assert.isTypeOf("object", {});
        },

        "isTypeOf() should pass for null value as object type": function(){
            Assert.isTypeOf("object", null);
        },

        "isTypeOf() should pass for undefined value as undefined type": function(){
            Assert.isTypeOf("undefined", undefined);
        },

        "isTypeOf() should pass for true value as boolean type": function(){
            Assert.isTypeOf("boolean", true);
        },

        "isTypeOf() should pass for false value as boolean type": function(){
            Assert.isTypeOf("boolean", false);
        },

        "isTypeOf() should pass for function value as function type": function(){
            Assert.isTypeOf("function", new Function());
        },
                
        "isTypeOf() should fail for function value as object type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("object", new Function());
            });
        },
                
        "isTypeOf() should fail for false value as number type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("number", false);
            });
        },

        "isTypeOf() should fail for false value as string type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("string", false);
            });
        },

        "isTypeOf() should fail for true value as string type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("string", true);
            });
        },

        "isTypeOf() should fail for zero value as string type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("string", 0);
            });
        },

        "isTypeOf() should fail for non-zero numeric value as string type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("string", 10);
            });
        },

        "isTypeOf() should fail for object value as string type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("string", {});
            });
        },

        "isTypeOf() should fail for null value as string type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("string", null);
            });
        },

        "isTypeOf() should fail for undefined value as string type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("string", undefined);
            });
        },

        "isTypeOf() should fail for false value as number type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("number", false);
            });
        },

        "isTypeOf() should fail for true value as number type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("number", true);
            });
        },

        "isTypeOf() should fail for non-empty string value as number type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("number", "foo");
            });
        },

        "isTypeOf() should fail for empty string value as number type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("number", "");
            });
        },

        "isTypeOf() should fail for object value as number type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("number", {});
            });
        },

        "isTypeOf() should fail for null value as number type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("number", null);
            });
        },

        "isTypeOf() should fail for undefined value as number type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("number", undefined);
            });
        },        
        
        "isTypeOf() should fail for zero value as boolean type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("boolean", 0);
            });
        },

        "isTypeOf() should fail for non-zero numeric value as boolean type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("boolean", 10);
            });
        },

        "isTypeOf() should fail for non-empty string value as boolean type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("boolean", "foo");
            });
        },

        "isTypeOf() should fail for empty string value as boolean type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("boolean", "");
            });
        },

        "isTypeOf() should fail for object value as boolean type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("boolean", {});
            });
        },

        "isTypeOf() should fail for null value as boolean type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("boolean", null);
            });
        },

        "isTypeOf() should fail for undefined value as boolean type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("boolean", undefined);
            });
        },    

        "isTypeOf() should fail for true value as undefined type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("undefined", true);
            });
        },

        "isTypeOf() should fail for false value as undefined type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("undefined", false);
            });
        },

        "isTypeOf() should fail for zero value as undefined type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("undefined", 0);
            });
        },

        "isTypeOf() should fail for non-zero numeric value as undefined type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("undefined", 10);
            });
        },

        "isTypeOf() should fail for non-empty string value as undefined type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("undefined", "foo");
            });
        },

        "isTypeOf() should fail for empty string value as undefined type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("undefined", "");
            });
        },

        "isTypeOf() should fail for object value as undefined type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("undefined", {});
            });
        },

        "isTypeOf() should fail for null value as undefined type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("undefined", null);
            });
        },

//--

        "isTypeOf() should fail for true value as object type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("object", true);
            });
        },

        "isTypeOf() should fail for false value as object type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("object", false);
            });
        },

        "isTypeOf() should fail for zero value as object type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("object", 0);
            });
        },

        "isTypeOf() should fail for non-zero numeric value as object type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("object", 10);
            });
        },

        "isTypeOf() should fail for non-empty string value as object type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("object", "foo");
            });
        },

        "isTypeOf() should fail for empty string value as object type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("object", "");
            });
        },

        "isTypeOf() should fail for undefined value as object type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("object", undefined);
            });
        },


        "isTypeOf() should fail for true value as function type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("function", true);
            });
        },

        "isTypeOf() should fail for false value as function type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("function", false);
            });
        },

        "isTypeOf() should fail for zero value as function type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("function", 0);
            });
        },

        "isTypeOf() should fail for non-zero numeric value as function type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("function", 10);
            });
        },

        "isTypeOf() should fail for non-empty string value as function type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("function", "foo");
            });
        },

        "isTypeOf() should fail for empty string value as function type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("function", "");
            });
        },

        "isTypeOf() should fail for null value as function type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("function", null);
            });
        },  
        
        "isTypeOf() should fail for undefined value as function type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("function", undefined);
            });
        },  
        
        "isTypeOf() should fail for object value as function type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isTypeOf("function", {});
            });
        },  
        
        "isTypeOf() should throw a custom message when failing": function(){
            Assert.throwsError(new YUITest.ComparisonFailure("Something bad happened."), function(){
                Assert.isTypeOf("string", 0, "Something bad happened.");
            });
        }          
    }));            
                
    //-------------------------------------------------------------------------
    // Test Case for isInstanceOf() assertions
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "isInstanceOf() Assert Tests",
        
        "isInstanceOf() should pass for direct instance": function(){
            Assert.isInstanceOf(Object, {});
        },
        
        "isInstanceOf() should pass for inherited instance": function(){
            Assert.isInstanceOf(Object, []);
        },
        
        "isInstanceOf() should fail for object value as function type": function(){
            Assert.throwsError(YUITest.ComparisonFailure, function(){
                Assert.isInstanceOf(String, {});
            });
        },  
        
        "isInstanceOf() should throw a custom message when failing": function(){
            Assert.throwsError(new YUITest.ComparisonFailure("Something bad happened."), function(){
                Assert.isInstanceOf(String, 0, "Something bad happened.");
            });
        }  
        
    }));
                
        
    //add it to be run
    YUITest.TestRunner.add(suite);

})();
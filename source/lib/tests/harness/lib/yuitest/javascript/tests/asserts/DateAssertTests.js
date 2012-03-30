(function(){

    var Assert          = YUITest.Assert,
		DateAssert		= YUITest.DateAssert;
    
    //-------------------------------------------------------------------------
    // Base Test Suite
    //-------------------------------------------------------------------------
    
    var suite = new YUITest.TestSuite("DateAssert Tests");
    
    //-------------------------------------------------------------------------
    // Test Case for datesAreEqual()
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "datesAreEqual() Assert Tests",

        "datesAreEqual() should pass when dates are identical": function(){
            DateAssert.datesAreEqual(new Date(0), new Date(0));        
        },
        
        "datesAreEqual() should fail when years are different": function(){
			Assert.throwsError(YUITest.ComparisonFailure, function(){
				DateAssert.datesAreEqual(new Date(2005, 5, 5), new Date(2006, 5, 5));        
			});
        },
        
        "datesAreEqual() should fail when days are different": function(){
			Assert.throwsError(YUITest.ComparisonFailure, function(){
				DateAssert.datesAreEqual(new Date(2006, 5, 6), new Date(2006, 5, 5));        
			});
        },
        
        "datesAreEqual() should fail when months are different": function(){
			Assert.throwsError(YUITest.ComparisonFailure, function(){
				DateAssert.datesAreEqual(new Date(2006, 6, 5), new Date(2006, 5, 5));        
			});
        },
		
        "datesAreEqual() should throw an error if first value isn't a Date": function(){
			Assert.throwsError(TypeError, function(){
				DateAssert.datesAreEqual({}, new Date(2006, 5, 5));        
			});
        },
		
        "datesAreEqual() should throw an error if second value isn't a Date": function(){
			Assert.throwsError(TypeError, function(){
				DateAssert.datesAreEqual(new Date(2006, 5, 5), {});        
			});
        }

    }));
     
    //-------------------------------------------------------------------------
    // Test Case for timesAreEqual()
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "timesAreEqual() Assert Tests",

        "timesAreEqual() should pass when dates are identical": function(){
            DateAssert.timesAreEqual(new Date(0), new Date(0));        
        },
        
        "timesAreEqual() should fail when hours are different": function(){
			Assert.throwsError(YUITest.ComparisonFailure, function(){
				DateAssert.timesAreEqual(new Date(2005, 5, 5, 12), new Date(2005, 5, 5, 11));        
			});
        },
        
        "timesAreEqual() should fail when minutes are different": function(){
			Assert.throwsError(YUITest.ComparisonFailure, function(){
				DateAssert.timesAreEqual(new Date(2005, 5, 5, 12, 10), new Date(2005, 5, 5, 12, 12));        
			});
        },
        
        "timesAreEqual() should fail when seconds are different": function(){
			Assert.throwsError(YUITest.ComparisonFailure, function(){
				DateAssert.timesAreEqual(new Date(2006, 5, 5, 12, 10, 5), new Date(2005, 5, 5, 12, 10, 6));        
			});
        },
		
        "timesAreEqual() should throw an error if first value isn't a Date": function(){
			Assert.throwsError(TypeError, function(){
				DateAssert.timesAreEqual({}, new Date(2006, 5, 5));        
			});
        },
		
        "timesAreEqual() should throw an error if second value isn't a Date": function(){
			Assert.throwsError(TypeError, function(){
				DateAssert.timesAreEqual(new Date(2006, 5, 5), {});        
			});
        }

    }));
    
                
        
    //add it to be run
    YUITest.TestRunner.add(suite);

})();
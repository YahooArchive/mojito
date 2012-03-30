(function(){

    var Assert          = YUITest.Assert,
        ArrayAssert     = YUITest.ArrayAssert;
    
    //-------------------------------------------------------------------------
    // Base Test Suite
    //-------------------------------------------------------------------------
    
    var suite = new YUITest.TestSuite("Array Assert Tests");
    
    //-------------------------------------------------------------------------
    // Test Case for contains()
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "Contains Assert Tests",
        
        _should: {
            fail: {
                "contains() should fail when a similar item exists": new YUITest.AssertionError("Value 1 (number) not found in array [1,0,false,text]."),
                "contains() should throw a custom error message during failure": new YUITest.AssertionError("True should not be there: Value 1 (number) not found in array [1,0,false,text]."),
                "contains() should fail when the item doesn't exist": new YUITest.AssertionError("Value true (boolean) not found in array [1,0,false,text].")
            }
        },
        
        setUp: function(){
            this.testArray = ["1", 0, false, "text"];
        },
        
        tearDown: function(){
            delete this.testArray;
        },
        
        "contains() should pass when the given item exists": function () {
            ArrayAssert.contains("1", this.testArray);
        },
        
        "contains() should fail when a similar item exists": function () {
            ArrayAssert.contains(1, this.testArray);
        },
        
        "contains() should fail when the item doesn't exist": function() {
            ArrayAssert.contains(true, this.testArray);
        },
        
        "contains() should throw a custom error message during failure": function(){
            ArrayAssert.contains(true, this.testArray, "True should not be there: {message}");
        }
    }));        
    
    //-------------------------------------------------------------------------
    // Test Case for contains()
    //-------------------------------------------------------------------------
        
    suite.add(new YUITest.TestCase({
    
        name: "ContainsItems Assert Tests",
        
        _should: {
            fail: {
                testSimilarItems: new YUITest.AssertionError("Value 1 (number) not found in array [1,0,false,text]."),
                testNonExistingItems: new YUITest.AssertionError("Value true (boolean) not found in array [1,0,false,text].")
            }
        },
        
        setUp: function(){
            this.testArray = ["1", 0, false, "text"];
        },
        
        tearDown: function(){
            delete this.testArray;
        },
        
        testExistingItems: function () {
            ArrayAssert.containsItems(["1",0], this.testArray);
        },
        
        testSimilarItems: function () {
            ArrayAssert.containsItems([1,0], this.testArray);
        },
        
        testNonExistingItems: function() {
            ArrayAssert.containsItems([true], this.testArray);
        }
    }));
    
    //-------------------------------------------------------------------------
    // Test Case for containsMatch()
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "ContainsMatch Assert Tests",
        
        _should: {
            fail: {
                testNonExistingItems: new YUITest.AssertionError("No match found in array [1,0,false,text].")
            }
        },
        
        setUp: function(){
            this.testArray = ["1", 0, false, "text"];
        },
        
        tearDown: function(){
            delete this.testArray;
        },
        
        testExistingItems: function () {
            ArrayAssert.containsMatch(function(value){
                return typeof(value) == "string";
            }, this.testArray);
        },
        
        testNonExistingItems: function() {
            ArrayAssert.containsMatch(function(value){
                return value && typeof value == "object";
            }, this.testArray);
        }
    }));
    
    //-------------------------------------------------------------------------
    // Test Case for itemsAreSame()
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "itemsAreSame Assert Tests",
        
        _should: {
            fail: {
                testMissingItem: new YUITest.AssertionError("Values in position 3 are not the same."),
                testArrayAgainstObject: new YUITest.AssertionError("Values in position 0 are not the same.")
            }
        },
        
        setUp: function(){
            this.testArray = ["1", 0, false, "text"];
        },
        
        tearDown: function(){
            delete this.testArray;
        },
        
        testItemsAreSame: function () {
            ArrayAssert.itemsAreSame(this.testArray,["1", 0, false, "text"]);
        },
        
        testMissingItem: function() {
            ArrayAssert.itemsAreSame(this.testArray, ["1", 0, false]);
        },
        
        testArrayAgainstObject: function(){
            ArrayAssert.itemsAreSame(this.testArray, {});
        }
    }));
    
    //-------------------------------------------------------------------------
    // Test Case for itemsAreEqual()
    //-------------------------------------------------------------------------
    
    suite.add(new YUITest.TestCase({
    
        name: "itemsAreEqual Assert Tests",
        
        _should: {
            fail: {
                testMissingItem: new YUITest.AssertionError("Values in position 3 are not equal."),
                testArrayAgainstObject: new YUITest.AssertionError("Values in position 0 are not equal.")
            }
        },
        
        setUp: function(){
            this.testArray = ["1", 0, false, "text"];
        },
        
        tearDown: function(){
            delete this.testArray;
        },
        
        testItemsAreEqual: function () {
            ArrayAssert.itemsAreEqual(this.testArray,["1", 0, false, "text"]);
        },
        
        testMissingItem: function() {
            ArrayAssert.itemsAreEqual(this.testArray, ["1", 0, false]);
        },
        
        testArrayAgainstObject: function(){
            ArrayAssert.itemsAreEqual(this.testArray, {});
        }
    }));  
  
    //-------------------------------------------------------------------------
    // Test Case for itemsAreEquivalent()
    //-------------------------------------------------------------------------
  
    suite.add(new YUITest.TestCase({
    
        name: "itemsAreEquivalent Assert Tests",
        
        _should: {
            fail: {
                testMissingItem: new YUITest.AssertionError("Values in position 3 are not equal."),
                testArrayAgainstObject: new YUITest.AssertionError("Values in position 0 are not equal.")
            }
        },
        
        setUp: function(){
            this.testArray = ["1", 0, false, "text"];
            this.comparator = function(a,b){
                return a == b;
            };
        },
        
        tearDown: function(){
            delete this.testArray;
            delete this.comparator;
        },
        
        testItemsAreEqual: function () {
            ArrayAssert.itemsAreEquivalent(this.testArray,["1", 0, false, "text"], this.comparator);
        },
        
        testMissingItem: function() {
            ArrayAssert.itemsAreEquivalent(this.testArray, ["1", 0, false], this.comparator);
        },
        
        testArrayAgainstObject: function(){
            ArrayAssert.itemsAreEquivalent(this.testArray, {}, this.comparator);
        }
    }));   
          

    //add it to be run
    YUITest.TestRunner.add(suite);

})();
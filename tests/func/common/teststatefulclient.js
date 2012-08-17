/*
 * This is a basic func test for a Common application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
    var suite = new Y.Test.Suite("Common");

    suite.add(new Y.Test.Case({

	  "test statefulclient": function() {
          var that = this;
          enterText(Y.one('#inputbox'), "baseball"); 
          Y.one('#pitchbutton').simulate('click');
          that.wait(function(){
              Y.Assert.areEqual('pitched: baseball', Y.one('#ControllerCachingResult').get('innerHTML').match(/pitched: baseball/gi));
          }, 2000);
          Y.one('#retrievebutton').simulate('click');
          that.wait(function(){
              Y.Assert.areEqual('ball: baseball', Y.one('#ControllerCachingResult').get('innerHTML').match(/ball: baseball/gi));
          }, 1000);
     }

   }));

   Y.Test.Runner.add(suite);

   function enterText(node, str){
       for (var i = 0, length = str.length; i < length; i++) {
           node.simulate("keypress", {
               charCode: str.charCodeAt(i)
           }); 	
       }
   }
});
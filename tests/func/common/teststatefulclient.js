/*
 * This is a basic func test for a Common application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
    var suite = new Y.Test.Suite("Common: statefulclient");

    suite.add(new Y.Test.Case({

	  "test statefulclient": function() {
          var that = this;
          Y.one('#inputbox').set('value', "baseball");
          Y.one('#pitchbutton').simulate('click');
          that.wait(function(){
              Y.Assert.areEqual('pitched: baseball', Y.one('#ControllerCachingResult').get('innerHTML').match(/pitched: baseball/gi));
          }, 4000);
          Y.one('#retrievebutton').simulate('click');
          that.wait(function(){
              Y.Assert.areEqual('ball: baseball', Y.one('#ControllerCachingResult').get('innerHTML').match(/ball: baseball/gi));
          }, 4000);
     }

   }));

   Y.Test.Runner.add(suite);
});
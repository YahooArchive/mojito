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

	  "test dependencyclient": function() {
          var that = this;
          Y.one('#DepCheckParentButton').simulate('click');
          that.wait(function(){
              Y.Assert.areEqual('0,1,Aardvark,attic,zebra,Zoo', Y.one('#myarray').get('innerHTML').match(/0,1,Aardvark,attic,zebra,Zoo/gi));
          }, 2000);
      }
      
    }));

     Y.Test.Runner.add(suite);

});
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

	  "test acpartailrenderserver": function() {
	      Y.Assert.areEqual(Y.one('pre').get('innerHTML').match(/this is my data: data not from url/gi), 'this is my data: data not from url');
      }

     }));

     Y.Test.Runner.add(suite);

});
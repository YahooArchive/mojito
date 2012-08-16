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
	  "test acpartialinvokeserver": function() {
	      Y.Assert.areEqual(Y.one('pre').get('innerHTML').match(/This is mytest1/gi), 'This is mytest1');
	      Y.Assert.areEqual(Y.one('pre').get('innerHTML').match(/data from url/gi), 'data from url');         
      }

   }));

   Y.Test.Runner.add(suite);

});

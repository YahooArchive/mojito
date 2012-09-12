/*
 * This is a basic func test for a Serveronly application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
     var suite = new Y.Test.Suite("ServerOnly: bz5300267");

     suite.add(new Y.Test.Case({
	  "test bz5300267": function(){
          var pagesource= window.document.documentElement.innerHTML;
          Y.Assert.areNotEqual('-1', pagesource.search("YouCanSeeMe"));
          Y.Assert.areNotEqual('-1', pagesource.search("CanSeeFromClient"));
          Y.Assert.areEqual('-1', pagesource.search("ShouldNotSeeFromClient"));
      }
  }));

  Y.Test.Runner.add(suite);
});

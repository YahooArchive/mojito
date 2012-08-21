/*
 * This is a basic func test for a Serveronly application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
     var suite = new Y.Test.Suite("Serveronly");

     suite.add(new Y.Test.Case({
	  "test bz5366776": function(){
          var pagesource= window.document.documentElement.innerHTML;
          Y.Assert.areNotEqual('-1', pagesource.search(".css"));
      }
  }));

  Y.Test.Runner.add(suite);
});

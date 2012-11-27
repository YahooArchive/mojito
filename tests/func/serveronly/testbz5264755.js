/*
 * This is a basic func test for a Serveronly application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
     var suite = new Y.Test.Suite("ServerOnly: bz5264755");

     suite.add(new Y.Test.Case({
	  "test bz5264755": function(){
          var pagesource= window.document.documentElement.innerHTML;
          Y.Assert.isTrue((pagesource.search("\"appPort\":4083")!=-1)||(pagesource.search("\"appPort\": 4083")!=-1));
      }
  }));

  Y.Test.Runner.add(suite);
});

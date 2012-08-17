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
	  "test bz5249892": function(){
          var pagesource= window.document.documentElement.innerHTML;
          var sub = pagesource.match(/http:\/\/yui.yahooapis.com\/combo?/gi);
          Y.log("*******"+sub.length);
          if(sub.length < 3){
              Y.fail("the js src is not broken to parts.");
          }     
      }
  }));

  Y.Test.Runner.add(suite);
});

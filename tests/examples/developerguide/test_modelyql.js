/*
 * This is a basic func test for a UseCase application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
         var suite = new Y.Test.Suite("DeveloperGuide: modelyql");

         suite.add(new Y.Test.Case({
         
             "test modelyql": function() {
                 for(i=0; i<Y.all('a').size(); i++){
                     Y.Assert.areEqual("static.flickr.com", Y.all('a').item(i).getAttribute('href').match(/static.flickr.com/gi));
                 }
             }
         }));    
         Y.Test.Runner.add(suite);
});


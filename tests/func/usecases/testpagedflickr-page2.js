/*
 * This is a basic func test for a UseCase application.
 */

YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', 'intl', 'datatype-date-format', function (Y) {

    
         var suite = new Y.Test.Suite("UseCases: pagedflickr-page2");

         suite.add(new Y.Test.Case({
         
             "test pagedflickr-page2": function() {
                    Y.Assert.areEqual('Enjoy your Flickr Images!', Y.one('h2').get('innerHTML').match(/Enjoy your Flickr Images!/gi));
                    Y.Assert.areEqual("previous", Y.all('#paginate a').item(0).get('innerHTML'));
                    Y.Assert.areEqual("next", Y.all('#paginate a').item(1).get('innerHTML'));
                    Y.Assert.areEqual("flickr?page=1", Y.all('#paginate a').item(0).get('href').match(/flickr\?page=1/gi));
                    Y.Assert.areEqual("flickr?page=3", Y.all('#paginate a').item(1).get('href').match(/flickr\?page=3/gi));
                    
                }
         }));

         Y.Test.Runner.add(suite);
});

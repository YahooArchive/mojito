/*
 * This is a basic func test for a UseCase application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', 'intl', 'datatype-date-format', function (Y) {
    
         var suite = new Y.Test.Suite("UseCases: preinit");

         suite.add(new Y.Test.Case({
             "test preinit": function() {
                   var that = this;
                   Y.Assert.areEqual('Enjoy your Flickr Images!',Y.one('h2').get('innerHTML').match(/Enjoy your Flickr Images!/gi));
                   var imagelink = Y.all('a').item(1).get('href');
                   Y.Assert.areEqual('http:',imagelink.match(/http:/gi));
                   Y.Assert.areEqual('static.flickr.com',imagelink.match(/static.flickr.com/gi));
                   Y.Assert.areEqual('page=2', Y.one('#paginate a').get('href').match(/page=2/gi));
                   Y.Assert.areEqual('next', Y.one('#paginate a').get('innerHTML'));
                   Y.one('#paginate a').simulate('click');
                   that.wait(function(){
                       Y.Assert.areEqual('Hallo!',Y.one('h2').get('innerHTML').match(/Hallo!/gi));
                       Y.Assert.areEqual('zur',Y.one('#paginate a').get('innerHTML').match(/zur/gi));
                       Y.Assert.areEqual('weiter',Y.all('#paginate a').item(1).get('innerHTML').match(/weiter/gi));
                   }, 2000);        
               }
         }));

         Y.Test.Runner.add(suite);
});

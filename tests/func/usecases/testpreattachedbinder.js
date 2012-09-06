/*
 * This is a basic func test for a UseCase application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', 'intl', 'datatype-date-format', function (Y) {
    
         var suite = new Y.Test.Suite("UseCase");

         suite.add(new Y.Test.Case({
             "test preattachedbinder": function() {
                   var that = this;
                   Y.Assert.areEqual('Enjoy your Flickr Images!',Y.one('h2').get('innerHTML').match(/Enjoy your Flickr Images!/gi));
                   Y.Assert.areEqual('\"This is the config for config1 in application.json\"', Y.one('#myconfig').get('innerHTML'));
                   Y.one('#paginate a').simulate('click');
                   that.wait(function(){
                       Y.Assert.areEqual('Hallo!',Y.one('h2').get('innerHTML').match(/Hallo!/gi));
                       Y.Assert.areEqual('\"mynewconfig\"', Y.one('#myconfig').get('innerHTML'));
                   }, 2000);        
               }
             
         }));

         Y.Test.Runner.add(suite);
});

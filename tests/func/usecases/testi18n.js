/*
 * This is a basic func test for a UseCase application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', 'intl', 'datatype-date-format', function (Y) {
   
         var suite = new Y.Test.Suite("UseCases: i18n");

         suite.add(new Y.Test.Case({
             "test i18n": function() {
                   var title = Y.one('h2').get('innerHTML');
                   Y.Assert.areEqual('Enjoy your Flickr Images!', title.match(/Enjoy your Flickr Images!/gi));
                   var imagelink = Y.all('a').item(1).get('href');
                   Y.Assert.areEqual('http:', imagelink.match(/http:/gi));
                   Y.Assert.areEqual('static.flickr.com', imagelink.match(/static.flickr.com/gi));
                   Y.Intl.add("datatype-date-format", "en-US", {
                      "x":"%d/%m/%Y"
                   });
                   Y.Intl.setLang("datatype-date-format", "en-US");
                   var mydate = Y.DataType.Date.format(new Date(), {format:"%d/%m/%Y"});
                   var expecteddate = mydate.slice(3,6)+mydate.slice(0,3)+mydate.slice(8,10);
                   Y.Assert.areEqual(expecteddate, title.substr(title.indexOf('-')+2, 8));
         }}));

         Y.Test.Runner.add(suite);
});


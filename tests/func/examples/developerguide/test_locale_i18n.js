/*
 * This is a basic func test for a UseCase application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', 'intl', 'datatype-date-format', function (Y) {
   
         var suite = new Y.Test.Suite("DeveloperGuide: locale_i18n");

         suite.add(new Y.Test.Case({
         
             "test locale_i18n": function() {
                 var test = ARROW.testParams["testName"];
                 if(test === "Default"){
                     Y.log("here...."+Y.one('body').get('innerHTML'));
                     Y.Assert.areEqual("Hello!", Y.one('body').get('innerHTML').match(/Hello!/gi));
                     var expecteddate = Y.DataType.Date.format(new Date(), {format:"%m/%d"});
                         body = Y.one('body').get('innerHTML');
                         actualdate = body.substr(body.indexOf('-')+3, 5);
                     Y.Assert.areEqual(expecteddate, actualdate);
                 }else if(test === "en-AU"){
                     Y.log("here...."+Y.one('body').get('innerHTML'));
                     Y.Assert.areEqual("G'day!", Y.one('body').get('innerHTML').match(/G'day!/gi));
                     var expecteddate = Y.DataType.Date.format(new Date(), {format:"%d/%m"});
                         body = Y.one('body').get('innerHTML');
                         actualdate = body.substr(body.indexOf('-')+3, 5);
                     Y.Assert.areEqual(expecteddate, actualdate);
                 }else if(test === "fr-FR"){
                     Y.log("here...."+Y.one('body').get('innerHTML'));
                     Y.Assert.areEqual("Tiens!", Y.one('body').get('innerHTML').match(/Tiens!/gi));
                     var expecteddate = Y.DataType.Date.format(new Date(), {format:"%d/%m"});
                         body = Y.one('body').get('innerHTML');
                         actualdate = body.substr(body.indexOf('-')+3, 5);
                     Y.Assert.areEqual(expecteddate, actualdate);
                 }
             }
         }));    

         Y.Test.Runner.add(suite);
});


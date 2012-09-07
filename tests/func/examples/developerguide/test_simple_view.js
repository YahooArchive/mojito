/*
 * This is a basic func test for a UseCase application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
         var suite = new Y.Test.Suite("Developerguide");

         suite.add(new Y.Test.Case({
         
             "test simpleview": function() {
                 Y.Assert.areEqual("Simple View", Y.one('h2').get('innerHTML'));
                 Y.Assert.areEqual("type: simple", Y.all('div').item(1).get('innerHTML'));
                 var currentTime = new Date();
                     hours = currentTime.getHours();
                     minutes = currentTime.getMinutes();
                 var time;
                 if(minutes < 10){
                     minutes = "0"+minutes;
                 }
                 if(hours > 11){
                     if(hours > 12){
                           hours = hours-12;
                     }
                     time = "time: "+ hours +":"+minutes +" p.m.";
                 }else{
                     time = "time: "+ hours +":"+minutes +" a.m."
                 }
                 Y.log("time..."+time);
                 Y.log("time..."+Y.all('div').item(2).get('innerHTML'));
                 Y.Assert.areEqual(time, Y.all('div').item(2).get('innerHTML'));
                 Y.Assert.areEqual("show: simple", Y.all('div').item(3).get('innerHTML'));
                 Y.Assert.areEqual("hide: ", Y.all('div').item(4).get('innerHTML'));
                 Y.Assert.areEqual("no show: ", Y.all('div').item(5).get('innerHTML'));
                 Y.Assert.areEqual("no hide: simple", Y.all('div').item(6).get('innerHTML'));
                 Y.Assert.areEqual("list: 213", Y.all('div').item(7).get('innerHTML'));
                 Y.Assert.areEqual("hole: no list", Y.all('div').item(8).get('innerHTML'));
             }
         }));    

         Y.Test.Runner.add(suite);
});


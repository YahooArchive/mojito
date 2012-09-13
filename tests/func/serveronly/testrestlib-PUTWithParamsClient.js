/*
 * This is a basic func test for a Serveronly application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
     var suite = new Y.Test.Suite("ServerOnly: PUTWithParamsClient");

     suite.add(new Y.Test.Case({
         
	   "test PUTWithParamsClient": function() {
	        var that = this;
	        Y.one('#p_putParam').simulate('click');
            that.wait(function(){
                Y.Assert.areEqual('(METHOD: PUT) This is sprint 4 for the project Mojito', Y.one('#output').get('innerHTML'));
            }, 2000);
       }
       
    }));
    
    Y.Test.Runner.add(suite);

});

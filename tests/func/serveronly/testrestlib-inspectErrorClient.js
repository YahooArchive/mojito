/*
 * This is a basic func test for a Serveronly application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
     var suite = new Y.Test.Suite("ServerOnly: inspectErrorClient");

     suite.add(new Y.Test.Case({
         
	   "test inspectErrorClient": function() {
	        var that = this;
	        Y.one('#p_inspectErr').simulate('click');
            that.wait(function(){
			    Y.Assert.areEqual('Cannot GET \/invalidURL', Y.one('#td_inspectErr').get('innerHTML').match(/Cannot GET \/invalidURL/gi));
            }, 2000);
       }
       
    }));
    
    Y.Test.Runner.add(suite);

});

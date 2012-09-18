/*
 * This is a basic func test for a Serveronly application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
     var suite = new Y.Test.Suite("ServerOnly: inspectResponseHeaderClient");

     suite.add(new Y.Test.Case({
         
	   "test inspectResponseHeaderClient": function() {
	        var that = this;
            Y.one('#p_inspectResp').simulate('click');
            that.wait(function(){
			  Y.Assert.areEqual('Headers: X-Powered-By: Express', Y.one('#headers').get('innerHTML').match(/Headers: X-Powered-By: Express/gi));
			  Y.Assert.areEqual('Content-Type: text\/html; charset=utf-8', Y.one('#headers').get('innerHTML').match(/Content-Type: text\/html; charset=utf-8/gi));
			  Y.Assert.areEqual('Connection: keep-alive', Y.one('#headers').get('innerHTML').match(/Connection: keep-alive/gi));
			  Y.Assert.areEqual('Transfer-Encoding: chunked', Y.one('#headers').get('innerHTML').match(/Transfer-Encoding: chunked/gi));
			  Y.Assert.areEqual('Specific Header: text\/html; charset=utf-8', Y.one('#specific_header').get('innerHTML'));
           }, 4000);
       }
       
    }));
    
    Y.Test.Runner.add(suite);

});

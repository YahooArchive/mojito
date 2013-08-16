/*
 * This is a basic func test for a Serveronly application.
 */
YUI.add('serveronly-inspectresponseheaderclient-tests', function (Y) {
    
     var suite = new Y.Test.Suite("ServerOnly: inspectResponseHeaderClient");

     suite.add(new Y.Test.Case({
         
	   "test inspectResponseHeaderClient": function() {
	        var that = this;
            Y.one('#p_inspectResp').simulate('click');
            that.wait(function(){
               Y.Assert.areEqual('Headers:', Y.one('#headers').get('innerHTML').match(/Headers:/gi));
			   Y.Assert.areEqual('content-type: text\/html; charset=utf-8', Y.one('#headers').get('innerHTML').match(/content-type: text\/html; charset=utf-8/gi));
			   Y.Assert.areEqual('Connection: keep-alive', Y.one('#headers').get('innerHTML').match(/Connection: keep-alive/gi));
			   Y.Assert.areEqual('Transfer-Encoding: chunked', Y.one('#headers').get('innerHTML').match(/Transfer-Encoding: chunked/gi));
			   Y.Assert.areEqual('Specific Header: text\/html; charset=utf-8', Y.one('#specific_header').get('innerHTML'));
           }, 4000);
       }
       
    }));
    
    Y.Test.Runner.add(suite);

}, '0.0.1', {requires: [
    'node', 'node-event-simulate', 'test', 'console', 'intl', 'datatype-date-format'
]});

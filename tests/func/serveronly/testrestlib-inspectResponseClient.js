/*
 * This is a basic func test for a Serveronly application.
 */
YUI.add('serveronly-restlibclient-tests', function (Y) {
   
     var suite = new Y.Test.Suite("ServerOnly: RestLibClient");

     suite.add(new Y.Test.Case({
         
	   "test RestLibClient": function() {
	        var that = this;
	        Y.one('#p_inspectResp').simulate('click');
            that.wait(function(){
			  Y.Assert.areEqual('Status Code: 200', Y.one('#code').get('innerHTML'));
			  Y.Assert.areEqual('Status Message: OK', Y.one('#msg').get('innerHTML'));
			  Y.Assert.areEqual('This is a very simple web service', Y.one('#output').get('innerHTML'));
            }, 2000);
       }
       
    }));
    
    Y.Test.Runner.add(suite);

}, '0.0.1', {requires: [
    'node', 'node-event-simulate', 'test', 'console', 'intl', 'datatype-date-format'
]});

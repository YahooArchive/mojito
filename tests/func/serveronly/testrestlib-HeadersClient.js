/*
 * This is a basic func test for a Serveronly application.
 */
YUI.add('serveronly-headerclient-tests', function (Y) {
   
     var suite = new Y.Test.Suite("ServerOnly: HeadersClient");

     suite.add(new Y.Test.Case({
         
	   "test HeadersClient": function() {
	        var that = this;
	        Y.one('#p_headers').simulate('click');
            that.wait(function(){
                Y.Assert.areEqual('somevalue', Y.one('#my_header').get('innerHTML'));
                Y.Assert.areEqual('Keep-Alive', Y.one('#connection').get('innerHTML'));
            }, 2000);
       }
       
    }));
    
    Y.Test.Runner.add(suite);

}, '0.0.1', {requires: [
    'node', 'node-event-simulate', 'test'
]});

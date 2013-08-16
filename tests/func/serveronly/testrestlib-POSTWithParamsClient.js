/*
 * This is a basic func test for a Serveronly application.
 */
YUI.add('serveronly-postwithparamsclient-tests', function (Y) {
   
     var suite = new Y.Test.Suite("ServerOnly: POSTWithParamsClient");

     suite.add(new Y.Test.Case({
         
	   "test POSTWithParamsClient": function() {
	        var that = this;
	        Y.one('#p_postParam').simulate('click');
            that.wait(function(){
                Y.Assert.areEqual('(METHOD: POST) This is sprint 4 for the project Mojito', Y.one('#output').get('innerHTML'));
            }, 4000);
       }
       
    }));
    
    Y.Test.Runner.add(suite);


}, '0.0.1', {requires: [
    'node', 'node-event-simulate', 'test'
]});

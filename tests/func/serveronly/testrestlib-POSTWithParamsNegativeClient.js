/*
 * This is a basic func test for a Serveronly application.
 */
YUI.add('serveronly-postwithparamsnegativeclient-tests', function (Y) {
   
     var suite = new Y.Test.Suite("ServerOnly: POSTWithParamsNegativeClient");

     suite.add(new Y.Test.Case({
         
	   "test POSTWithParamsNegativeClient": function() {
	        var that = this;
	        Y.one('#p_postParamNegative').simulate('click');
            that.wait(function(){
                Y.Assert.areEqual('(METHOD: GET) This is sprint undefined for the project undefined', Y.one('#output').get('innerHTML'));
            }, 2000);
       }
       
    }));
    
    Y.Test.Runner.add(suite);

}, '0.0.1', {requires: [
    'node', 'node-event-simulate', 'test'
]});

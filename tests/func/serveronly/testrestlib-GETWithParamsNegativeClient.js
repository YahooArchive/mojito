/*
 * This is a basic func test for a Serveronly application.
 */
YUI.add('serveronly-getwithparamsnegativeclient-tests', function (Y) {
   
     var suite = new Y.Test.Suite("ServerOnly: GETWithParamsNegativeClient");

     suite.add(new Y.Test.Case({
         
	   "test GETWithParamsNegativeClient": function() {
	        var that = this;
	        Y.one('#p_getParamNegative').simulate('click');
            that.wait(function(){
                Y.Assert.areEqual('(METHOD: POST) This is sprint undefined for the project undefined', Y.one('#output').get('innerHTML'));
            }, 2000);
       }
       
    }));
    
    Y.Test.Runner.add(suite);

}, '0.0.1', {requires: [
    'node', 'node-event-simulate', 'test'
]});

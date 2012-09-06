/*
 * This is a basic func test for a Serveronly application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
     var suite = new Y.Test.Suite("Serveronly");

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

});

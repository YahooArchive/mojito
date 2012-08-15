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
         
	   "test HeadersClient": function() {
	        var that = this;
	        Y.one('#p_headers').simulate('click');
            that.wait(function(){
                Y.Assert.areEqual('somevalue', Y.one('#my_header').get('innerHTML'));
                Y.Assert.areEqual('keep-alive', Y.one('#connection').get('innerHTML'));
            }, 2000);
       }
       
    }));
    
    Y.Test.Runner.add(suite);

});

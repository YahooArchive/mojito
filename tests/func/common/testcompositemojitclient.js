/*
 * This is a basic func test for a Common application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
    var suite = new Y.Test.Suite("Common");

    suite.add(new Y.Test.Case({

	    "test compositemojitclient": function() {
              var that = this;
              Y.one('#composite_mojit_button').simulate('click');
              that.wait(function(){
    	            Y.Assert.areEqual('This is the title from controller.js of layout', Y.one('#cmtitle').get('innerHTML').match(/This is the title from controller.js of layout/gi));
    	            Y.Assert.areEqual('Info about all the children:', Y.one('#cmtitle3').get('innerHTML').match(/Info about all the children:/gi));

    	            Y.Assert.areEqual('nav:', Y.all('#childrenname').item(0).get('innerHTML').match(/nav:/gi));
    				Y.Assert.areEqual('news:', Y.all('#childrenname').item(1).get('innerHTML').match(/news:/gi));
    				Y.Assert.areEqual('footer:', Y.all('#childrenname').item(2).get('innerHTML').match(/footer:/gi));

    				var st1 = '\"type\":\"CM_Nav\",\"config\":\{\"id\":\"nav\"\},\"instanceId\"';
    				var st2 = '\"type\":\"CM_News\",\"config\":\{\"id\":\"news\"\},\"instanceId\"';
    				var st3 = '\"base\":\"CM_Footer\",\"config\":\{\"id\":\"footer_id\"\},\"instanceId\"';

                    Y.Assert.areEqual(st1, Y.all('#childrenconfig').item(0).get('innerHTML').match(/\"type\":\"CM_Nav\",\"config\":\{\"id\":\"nav\"\},\"instanceId\"/gi));
    				Y.Assert.areEqual(st2, Y.all('#childrenconfig').item(1).get('innerHTML').match(/\"type\":\"CM_News\",\"config\":\{\"id\":\"news\"\},\"instanceId\"/gi));
    				Y.Assert.areEqual(st3, Y.all('#childrenconfig').item(2).get('innerHTML').match(/\"base\":\"CM_Footer\",\"config\":\{\"id\":\"footer_id\"\},\"instanceId\"/gi));	
             }, 3000);
         }

    }));

    Y.Test.Runner.add(suite);

});

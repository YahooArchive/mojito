/*
 * This is a basic func test for a Serveronly application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
     var suite = new Y.Test.Suite("ServerOnly: refreshview");

     suite.add(new Y.Test.Case({
	  "test refreshview": function(){
	      that = this;
	      Y.Assert.areEqual('Sports', Y.one('#titlesports').get('innerHTML'));
	      Y.one('#refreshViewButton').simulate('click');
	      that.wait(function(){
              Y.Assert.areEqual('Sports', Y.one('#titlesports').get('innerHTML'));
          }, 3000);
      }
  }));

  Y.Test.Runner.add(suite);
});

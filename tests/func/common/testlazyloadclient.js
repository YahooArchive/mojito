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

	  "test lazyloadclient": function() {
          var that = this;
          Y.one('#lazyLoadButton').simulate('click');
          that.wait(function(){
              Y.Assert.areEqual('Lazy Loading', Y.one('#header1').get('innerHTML').match(/Lazy Loading/gi));
              Y.Assert.areEqual('Defer:true', Y.one('#header2').get('innerHTML').match(/Defer:true/gi));
              Y.Assert.areEqual('I was lazy-loaded', Y.one('#hello').get('innerHTML').match(/I was lazy-loaded/gi));
              Y.Assert.areEqual('\"mojit\"\:\{', Y.one('#finalLazyResult').get('innerHTML').match(/\"mojit\"\:\{/gi));
              Y.Assert.areEqual('\"type\"\:\"LazyChild\"', Y.one('#finalLazyResult').get('innerHTML').match(/\"type\"\:\"LazyChild\"/gi));
              Y.Assert.areEqual('\"action\"\:\"hello\"', Y.one('#finalLazyResult').get('innerHTML').match(/\"action\"\:\"hello\"/gi));
              Y.Assert.areEqual('\"defer\"\:false', Y.one('#finalLazyResult').get('innerHTML').match(/\"defer\"\:false/gi));
              Y.Assert.areEqual('LAZY LOAD COMPLETE', Y.one('#lazyResult').get('innerHTML').match(/LAZY LOAD COMPLETE/gi));
          }, 2000);
      }

    }));

    Y.Test.Runner.add(suite);

});
/*
 * This is a basic func test for a Common application.
 */
YUI.add('common-testlazyloadrpccommonclient-tests', function (Y) {
   
    var suite = new Y.Test.Suite("Common: LazyLoadRPCClientCommon");

    suite.add(new Y.Test.Case({

        "test LazyLoadRPCCommonClient": function() {
            var that = this;
            Y.one('#lazyloadrpccommonButton').simulate('click');
            that.wait(function(){
                Y.log("here....");
                Y.Assert.areEqual('Lazy load succeeded:', Y.one('#LazyLoadRPCCommontitle').get('innerHTML'));
                Y.log("here...1.");
                Y.Assert.areEqual('fooc-value set by binder', Y.one('#LazyLoadRPCCommonfoo').get('innerHTML'));
                Y.Assert.areEqual('barc-value set by controller', Y.one('#LazyLoadRPCCommonbar').get('innerHTML'));
                Y.Assert.areEqual('From controller: fooc-value set by binder', Y.one('#LazyLoadRPCCommonbaz').get('innerHTML'));
                Y.Assert.areEqual('Data has changed: 3 times', Y.one('#LazyLoadRPCCommoncount').get('innerHTML'));
            }, 2000);
        }
	  
    }));
    Y.Test.Runner.add(suite);

}, '0.0.1', { requires: [
    'node', 'node-event-simulate', 'test', 'console'
]});


/*
 * This is a basic func test for a Common application.
 */
YUI.add('common-testlazyloadrpcclient-tests', function (Y) {
   
    var suite = new Y.Test.Suite("Common: LazyLoadRPCClient");

    suite.add(new Y.Test.Case({

        "test LazyLoadRPCClient": function() {
            var that = this;
            Y.one('#lazyloadrpcButton').simulate('click');
            that.wait(function(){
                Y.Assert.areEqual('lazy load succeeded: mydatavalue', Y.one('#LazyLoadRPCResult').get('innerHTML'));
            }, 2000);
        }
	  
    }));
    Y.Test.Runner.add(suite);

}, '0.0.1', { requires: [
    'node', 'node-event-simulate', 'test', 'console'
]});


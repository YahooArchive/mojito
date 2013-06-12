YUI.add('LazyLoadRPC', function(Y, NAME) {

    Y.namespace('mojito.controllers')[NAME] = {
        
        index: function(ac) {
            ac.done();
        },

        lazyloadrpc: function(ac) {
            ac.data.set('mydata', "mydatavalue");
            ac.done();
        }
    };

}, '0.0.1', {requires: ['mojito', 'mojito-assets-addon', 'mojito-data-addon']});

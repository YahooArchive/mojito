YUI.add('MergePoster', function(Y) {
    
    Y.mojito.controller = {
        
        index: function(actionContext) {
            actionContext.done({
                desc: "Submit for for POST processing.",
                desc1:"Submit for POST simple processing"});
        }
        
    };
    
}, '0.0.1', {requires: []});

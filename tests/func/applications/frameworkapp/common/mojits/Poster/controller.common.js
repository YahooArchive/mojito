YUI.add('Poster', function(Y) {
    
    Y.mojito.controller = {
        
        index: function(actionContext) {
            actionContext.done({
                desc: "Submit for for example of POST processing.",
                desc1: "Submit for for example of filtered POST processing.",
                desc2: "Submit for for example of POST simple processing."
            });
        }
        
    };
    
}, '0.0.1', {requires: []});

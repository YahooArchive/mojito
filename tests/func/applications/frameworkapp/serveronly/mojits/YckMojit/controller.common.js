YUI.add('YckMojit', function(Y, NAME) {

    Y.namespace('mojito.controllers')[NAME] = {

        /**
         * Method corresponding to the 'index' action.
         *
         * @param actionContext {Object} The action context that provides access
         *        to the Mojito API.
         */
        index: function(actionContext) {
            var allcookies =actionContext.yck.get();
            //ycookie = new actionContext.yck.get("ycookie");
            var data = {
                allcookies:allcookies
            };
            actionContext.done(data);
        }

    };

}, '0.0.1', {requires: ['mojito', 'mojito-yck-addon']});

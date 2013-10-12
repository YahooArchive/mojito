
/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('Blog', function (Y, NAME) {

/**
 * The Blog module.
 *
 * @module Blog
 */

    /**
     * Constructor for the Controller class.
     *
     * @class Controller
     * @constructor
     */
    Y.namespace('mojito.controllers')[NAME] = {

        /**
         * Method corresponding to the 'index' action.
         *
         * @param ac {Object} The ActionContext that provides access
         *        to the Mojito API.
         */
        index: function (ac) {
            var view_type, feedURL, title;
            view_type = ac.params.getFromRoute('view_type') || "yui";

            if (view_type === "yui") {
                feedURL = ac.config.getDefinition('feedURL', 'notfound');
                title = ac.config.getDefinition('yuititle', 'notitle');
            } else if (view_type === "mojito") {
                feedURL = ac.config.getDefinition('feedURL', 'notfound');
                title = ac.config.getDefinition('mojitotitle', 'notitle');
            }

            ac.models.get('BlogModelYQL').getData({}, feedURL, function (err, data) {
                Y.log("Blog - index - model.getData:", "info", NAME);
                Y.log(data, "info", NAME);
                // add mojit specific css
                ac.assets.addCss('./index.css');
                Y.log("In Blog controller: ", "info", NAME); 
                if(err) {
                   ac.error(err); 
                } else {
                  // Populate and render blog template.
                  ac.done({
                      title: title,
                      results: data
                  });
                }
            });
        }
    };
}, '0.0.1', {requires: ['mojito', 'mojito-assets-addon', 'mojito-models-addon', 'mojito-params-addon', 'mojito-config-addon', 'mojito-helpers-addon']});

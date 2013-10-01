/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('Calendar', function (Y, NAME) {

/**
 * The Calendar module.
 *
 * @module Calendar
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
            ac.models.get('CalendarModelYQL').getData({}, function (data) {
                var title = "YUI Calendar Info";
                //Y.log("Calendar -index - model.getData:");
                //Y.log(data);
                //Y.log("data 0 :");
                //Y.log(data[0]);
                //Y.log("data 1 :");
                //Y.log(data[1]);

                // Add mojit specific CSS
                ac.assets.addCss('./index.css');
                if(data.error) {
                    // Error was found: render `error` template.
                    ac.done({ 
                        title: title, 
                        results: data 
                    }, "error");
                } else {
                    // Populate and render calendar template
                    ac.done({
                        title: title,
                        results: data
                    });
                }
            });
        }
    };
}, '0.0.1', {requires: ['mojito', 'mojito-assets-addon', 'mojito-models-addon']});

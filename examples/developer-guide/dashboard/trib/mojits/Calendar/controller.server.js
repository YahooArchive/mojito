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
                //Y.log("Calendar -index - model.getData:");
                //Y.log(data);
                //Y.log("data 0 :");
                //Y.log(data[0]);
                //Y.log("data 1 :");
                //Y.log(data[1]);

                // add mojit specific css
                ac.assets.addCss('./index.css');

                // populate blog template
                ac.done({
                    title: "YUI Calendar Info",
                    results: data
                });
            });
        }

    };

}, '0.0.1', {requires: ['mojito', 'mojito-assets-addon', 'mojito-models-addon']});

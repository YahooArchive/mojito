
/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('Twitter', function (Y, NAME) {

/**
 * The Twitter module.
 *
 * @module Twitter
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
            var view_type, q, title;
            view_type = ac.params.getFromRoute('view_type') || "yui";

            if (view_type === "yui") {
                q = "@yuilibrary";
                title = "YUI Twitter mentions";
            } else if (view_type === "mojito") {
                q = "#Mojito yahoo";
                title = "Mojito Twitter mentions";
            }

            ac.models.get('TwitterSearchModel').getData({}, q, function (err, data) {
                if (err) {
                    ac.error(err);
                    return;
                }

                // add mojit specific css
                ac.assets.addCss('./index.css');

                Y.log(data, "info", NAME);

                ac.done({
                    title: title,
                    results: data
                });
            });
        }

    };

}, '0.0.1', {requires: ['mojito', 'mojito-assets-addon', 'mojito-models-addon', 'mojito-params-addon', 'mojito-config-addon']});

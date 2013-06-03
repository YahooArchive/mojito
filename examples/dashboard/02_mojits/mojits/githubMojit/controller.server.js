/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('githubMojit', function(Y, NAME) {

/**
 * The githubMojit module.
 *
 * @module githubMojit
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
        index: function(ac) {
            ac.models.get('githubMojitModelFoo').getData(function(err, data) {
                if (err) {
                    ac.error(err);
                    return;
                }
                ac.assets.addCss('./index.css');
                ac.done({
                    title: ac.config.get('title'),
                    github: data
                });
            });
        }

    };

}, '0.0.1', {requires: ['mojito', 'mojito-assets-addon', 'mojito-models-addon', 'githubMojitModelFoo', 'mojito-config-addon']});

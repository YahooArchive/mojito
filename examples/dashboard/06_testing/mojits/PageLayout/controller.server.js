/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('PageLayout', function(Y, NAME) {

/**
 * The PageLayout module.
 *
 * @module PageLayout
 */

    /**
     * Constructor for the Controller class.
     *
     * @class Controller
     * @constructor
     */
    Y.namespace('mojito.controllers')[NAME] = {
        init: function(config){
            this.config = config;
        },

        /**
         * Method corresponding to the 'index' action.
         *
         * @param ac {Object} The ActionContext that provides access
         *        to the Mojito API.
         */
        index: function(ac) {
            ac.composite.done({
                title: "Trib - Contribute to the Tribe"
            });
        }
    };
}, '0.0.1', {requires: ['mojito','mojito-composite-addon']});

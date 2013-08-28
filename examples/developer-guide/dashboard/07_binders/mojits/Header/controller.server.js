/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('Header', function(Y, NAME) {

/**
 * The Header module.
 *
 * @module Header
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
            ac.done({
                title: ""
            });
        }

    };

}, '0.0.1', {requires: ['mojito']});

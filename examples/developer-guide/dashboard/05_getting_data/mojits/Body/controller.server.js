/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('Body', function(Y, NAME) {

/**
 * The Body module.
 *
 * @module Body
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
            Y.log("Body - controller.server.js index called");
            ac.composite.done({});
        }
    };
}, '0.0.1', {requires: ['mojito','mojito-composite-addon']});

/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('FooterMojit', function(Y, NAME) {

/**
 * The FooterMojit module.
 *
 * @module FooterMojit
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
                title: "Copyright 2013 Yahoo! Inc."
            });
        }

    };

}, '0.0.1', {requires: ['mojito']});

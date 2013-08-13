/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('FooterModelFoo', function(Y, NAME) {

/**
 * The FooterModelFoo module.
 *
 * @module Footer
 */

    /**
     * Constructor for the FooterModelFoo class.
     *
     * @class FooterModelFoo
     * @constructor
     */
    Y.namespace('mojito.models')[NAME] = {

        init: function(config) {
            this.config = config;
        },

        /**
         * Method that will be invoked by the mojit controller to obtain data.
         *
         * @param callback {function(err,data)} The callback function to call when the
         *        data has been retrieved.
         */
        getData: function(callback) {
            callback(null, { some: 'data' });
        }

    };

}, '0.0.1', {requires: []});
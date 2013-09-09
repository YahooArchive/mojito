/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('BodyModelFoo', function(Y, NAME) {

/**
 * The BodyModelFoo module.
 *
 * @module Body
 */

    /**
     * Constructor for the BodyModelFoo class.
     *
     * @class BodyModelFoo
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

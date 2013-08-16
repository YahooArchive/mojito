/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('GithubModelFoo', function(Y, NAME) {

/**
 * The GithubModelFoo module.
 *
 * @module GithubMojit
 */

    /**
     * Constructor for the GithubModelFoo class.
     *
     * @class GithubModelFoo
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
        getData: function(err, callback) {
            callback(null, { watchers: 1, forks: 1 });
        }
    };
}, '0.0.1', {requires: []});

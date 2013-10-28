/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('Github', function(Y, NAME) {

/**
 * The Github module.
 *
 * @module Github
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

            var model = ac.models.get('model');
            Y.log(model);
            model.getData(function(data){
                Y.log("Github -index - model.getData:");
                Y.log(data);

                ac.done({
                    title: "",
                    watchers: data.watchers,
                    forks: data.forks
                });
            });
        }

    };

}, '0.0.1', {requires: ['mojito', 'mojito-models-addon']});

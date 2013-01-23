/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true*/

YUI.add('PagerMojit', function (Y, NAME) {

    var PAGE_SIZE = 10;

    // Generate the link to the next page based on:   
    // - mojit id 
    // - action 
    // - params
    function createLink(actionContext, params) {
        var params_to_copy,
            mergedParams,
            k;
        if (actionContext.params.hasOwnProperty('merge')) {
            params_to_copy = actionContext.params.merged();
        } else {
            params_to_copy = actionContext.params.getFromMerged();
        }
        mergedParams = Y.mojito.util.copy(params_to_copy);
        for (k in params) {
            if (params.hasOwnProperty(k)) {
                mergedParams[k] = params[k];
            }
        }
        return actionContext.url.make('frame', 'index', Y.QueryString.stringify(mergedParams));
    }

    /**
     * Constructor for the Controller class.
     * @class Controller     
     * @constructor     
     */    
    Y.namespace('mojito.controllers')[NAME] = {
        index: function(actionContext) {
            var page = 0,
                start,
                model = actionContext.models.get('PagerMojitModel');
            if (actionContext.params.hasOwnProperty('merged')) {
                page = actionContext.params.merged('page');
            } else {
                page = actionContext.params.getFromUrl('page');
            }
            page = parseInt(page, 10) || 1;
            if ((!page) || (page < 1)) {
                page = 1;
            }
            // Page param is 1 based, but the model is 0 based       
            start = (page - 1) * PAGE_SIZE;
            // Data is an array of images
            model.getData('mojito', start, PAGE_SIZE, function(data) {
                Y.log('DATA: ' + Y.dump(data));
                var theData = {
                    data: data, // images
                    hasLink: false,
                    prev: {
                        title: "prev" // opportunity to localize
                    },
                    next: {
                        link: createLink(actionContext, {page: page + 1}),
                        title: "next"
                    },
                    query: 'mojito'
                };
                if (page > 1) {
                    theData.prev.link = createLink(actionContext, {page: page - 1});
                    theData.hasLink = true;
                }
                actionContext.done(theData);
            });
        }
    };
}, '0.0.1', {requires: [
    'mojito',
    'mojito-models-addon',
    'mojito-params-addon',
    'mojito-url-addon',
    'PagerMojitModel',
    'dump'
]});

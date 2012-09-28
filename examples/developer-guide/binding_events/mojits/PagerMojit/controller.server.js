/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('PagerMojit', function(Y, NAME) {

  var PAGE_SIZE = 10;
  /**
   * Constructor for the Controller class.
   * @class Controller     
   * @constructor     
  */    
  Y.namespace('mojito.controllers')[NAME] = {
    init: function(config) {
      this.config = config;
    },
    index: function(ac) {
      var page=0;
      if(ac.params.hasOwnProperty('merged')){
        page = ac.params.merged('page');
      }else{
        page=ac.params.getFromUrl('page');
      }
      var start;
      page = parseInt(page) || 1;
      if ((!page) || (page<1)) {
        page = 1; 
      }
      // Page param is 1 based, but the model is 0 based        
      start = (page - 1) * PAGE_SIZE;
      var model = ac.models.get('PagerMojitModel');
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
            link: createLink(ac, {page: page+1}),
            title: "next"
          },
          query: 'mojito'
        };
        if (page > 1) {
          theData.prev.link = createLink(ac, {page: page-1});
          theData.hasLink = true;
        }
        ac.done(theData);
      });
    }
  };
  // Generate the link to the next page based on:   
  // - mojit id 
  // - action 
  // - params
  function createLink(ac, params) {
    if(ac.params.hasOwnProperty('merge')){
      var params_to_copy=ac.params.merged();
    }else{
      var params_to_copy=ac.params.getFromMerged();
    }
    var mergedParams = Y.mojito.util.copy(params_to_copy);
    for (var k in params) {
      mergedParams[k] = params[k];
    }
    return ac.url.make('frame', 'index', Y.QueryString.stringify(mergedParams)); 
  }
}, '0.0.1', {requires: [
    'mojito',
    'mojito-models-addon',
    'mojito-params-addon',
    'mojito-url-addon',
    'PagerMojitModel',
    'dump']});

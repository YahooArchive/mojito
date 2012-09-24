/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('PagerMojitModel', function(Y) {
  var API_KEY = '84921e87fb8f2fc338c3ff9bf51a412e';

  /** 
  * The PagerMojitModel module.
  * @module PagerMojitModel 
  */
  /**
  * Constructor for the Model class.
  * @class Model 
  * @constructor 
  */
  Y.mojito.models.PagerMojit = {
    init: function(config) {
      this.config = config;
    },
    getData: function(query, start, count, callback) {
      var q = null;
      start = parseInt(start) || 0;
      count = parseInt(count) || 10;
      q = 'select * from flickr.photos.search(' + start + ',' + count + ')  where text="%' + query + '%" and api_key="' + API_KEY + '"';
      Y.log('QUERY: ' + q);
      Y.YQL(q, function(rawData) {
        if (!rawData.query.results) {
          callback([]);
          return;
        }
        var rawImages = rawData.query.results.photo,              
        rawImage = null,images = [], image = null, i = 0;         
        for (; i<rawImages.length; i++) {
          rawImage = rawImages[i];
          image = {
            title: rawImage.title, 
            location: 'http://farm' + rawImage.farm + '.static.flickr.com/' + rawImage.server + '/' + rawImage.id + '_' + rawImage.secret + '.jpg', farm: rawImage.farm,
            server: rawImage.server,
            image_id: rawImage.id,
            secret: rawImage.secret
          };
          if (!image.title) {
            image.title = "Generic Title: " + query;                
          }
          images.push(image);
        }
        callback(images);
      });
    }
  };
}, '0.0.1', {requires: ['yql']});

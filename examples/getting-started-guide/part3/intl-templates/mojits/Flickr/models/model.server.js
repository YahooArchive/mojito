/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('FlickrModel', function(Y) {
    var API_KEY = '84921e87fb8f2fc338c3ff9bf51a412e';

/**
 * The FlickrModel module.
 *
 * @module FlickrModel
 */

    Y.mojito.models.flickr = {

        /**
         * Method that will be invoked by the mojit controller to obtain data.
         *
         * @param callback {Function} The callback function to call when the
         *        data has been retrieved.
         */
        getFlickrImages: function(queryString, callback) {
            var q = 'select * from flickr.photos.search where text="' + queryString + '" and api_key="' + API_KEY + '"';
            Y.YQL(q, function(rawYqlData) {
                Y.log(rawYqlData);
                var rawPhotos = rawYqlData.query.results.photo,
                    rawPhoto = null,
                    photos = [],
                    photo = null,
                    i = 0;

                for (; i<rawPhotos.length; i++) {
                    rawPhoto = rawPhotos[i];
                    photo = {
                        title: rawPhoto.title,
                        url: buildFlickrUrlFromRecord(rawPhoto)
                    };
                    // some flickr photos don't have titles, so force them
                    if (!photo.title) {
                        photo.title = "[" + queryString + "]";
                    }
                    photos.push(photo);
                }
                Y.log('calling callback with photos');
                Y.log(photos);
                callback(photos);

            });
        }

    };

    function buildFlickrUrlFromRecord(record) {
        return 'http://farm' + record.farm 
            + '.static.flickr.com/' + record.server 
            + '/' + record.id + '_' + record.secret + '.jpg';
    }

// TODO: remove 'jsonp-url' requirement when YUI fix for bug http://yuilibrary.com/projects/yui3/ticket/2530251 is deployed.
}, '0.0.1', {requires: ['yql', 'jsonp-url']});

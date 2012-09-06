/*
* Copyright (c) 2011 Yahoo! Inc. All rights reserved.
*/
YUI.add('FlickrModel', function(Y) {

/**
 * The FlickrModel module.
 *
 * @module FlickrModel
 */

    Y.mojito.models.flickr = {

        /**
         * Method that will be invoked by the mojit controller to obtain data.
         * @method getFlickrImages
         * @param callback {Function} The callback function to call when the
         *        data has been retrieved.
         * @return {Object} photots
         */
        getFlickrImages: function(queryString, callback) {
            var API_KEY = '9cc79c8bf1942c683b0d4e30b838ee9c';
            var q = 'select * from flickr.photos.search where text="%' + queryString + '" and api_key="' + API_KEY + '"';
            Y.YQL(q, function(rawYqlData) {
                Y.log(rawYqlData);
                var rawPhotos = rawYqlData.query.results.photo,
                    rawPhoto = null
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

}, '0.0.1', {requires: ['yql']});

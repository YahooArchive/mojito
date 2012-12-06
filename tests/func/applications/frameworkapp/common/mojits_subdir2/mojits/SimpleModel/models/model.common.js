YUI.add('SimpleModelModel', function(Y) {
    
   Y.mojito.models.SimpleModel = {   
        init: function(cfg) {
            this.cfg = cfg;
        },
          
        getTurkeyImages: function(callback) {
            var API_KEY = '84921e87fb8f2fc338c3ff9bf51a412e';
            var queryString = 'wild turkey';
            var q = 'select * from flickr.photos.search where text="wild turkey" and api_key="' + API_KEY + '"';
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
        },
        
        getConfigFromModel: function(callback){
            Y.log("********In MODEL*************");
            Y.log("*********************"+this.cfg.myconfig0);
            Y.log("*********************"+this.cfg.myconfig1);
            Y.log("*********************"+this.cfg.myconfig2);
            Y.log("*********************"+this.cfg.myconfig3);
            var data = {
                myconfig0: this.cfg.myconfig0,
                myconfig1: this.cfg.myconfig1,
                myconfig2: this.cfg.myconfig2,
                myconfig3: this.cfg.myconfig3,
            }
            
            var mydata = [];
            mydata.push(data);
            callback(mydata);
        }

    };

    function buildFlickrUrlFromRecord(record) {
        return 'http://farm' + record.farm 
            + '.static.flickr.com/' + record.server 
            + '/' + record.id + '_' + record.secret + '.jpg';
    }
    
}, '0.0.1', {requires: [
    'mojito',
    'yql',
    'jsonp-url']}); 

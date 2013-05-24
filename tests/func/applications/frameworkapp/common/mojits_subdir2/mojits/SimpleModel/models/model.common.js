YUI.add('SimpleModelModel', function(Y) {
    
   Y.mojito.models.SimpleModel = {   
        init: function(cfg) {
            this.cfg = cfg;
        },
          
        getTurkeyImages: function(callback) {
            var photos = [
                {
                    "title": "Wild turkey1",
                    "url": "http://farm8.static.flickr.com/7456/8802989034_d4be06b6c9.jpg"
                },
                {
                    "title": "Wild turkey2",
                    "url": "http://farm3.static.flickr.com/2810/8790605005_ffabf53846.jpg"      
                },
                {
                    "title": "Wild turkey3",
                    "url": "http://farm8.static.flickr.com/7345/8796117836_bf224fdbfe.jpg"
                },
                {
                    "title": "Wild turkey4",
                    "url": "http://farm6.static.flickr.com/5332/8795818514_85d111d8e7.jpg"           
                },
                {
                    "title": "Wild turkey5",
                    "url": "http://farm6.static.flickr.com/5446/8784176565_6f21f6b7d5.jpg"           
                }
            ];
            setTimeout(function() {
                callback(photos);
            }, 10);
        },
        
        getConfigFromModel: function(callback){
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

YUI.add('TwitterSearchModel', function(Y, NAME) {
   Y.mojito.models[NAME] = {
    
    init: function(config) {
            this.config = config;
    },

    getData: function(count, cb) {


      var url = 'http://search.twitter.com/search.json';
      
      var params = {
        q:"@yuilibrary",
        rpp: "6"
      };
      
      var config = {
        timeout: 5000,
        headers: {
          'Cache-Control': 'max-age=0'
        }
      };

      Y.log("about to call rest");

      Y.mojito.lib.REST.GET(url, params, config, function(err, response) {
        if (err) {
          return cb(err);
        }

        var resp = Y.JSON.parse(response._resp.responseText).results;


        //Y.log("twitterSearch:");
        //Y.log(resp);

        cb(null, resp);
      });

    

    }
  };
}, '0.0.1', {requires: ['mojito', 'mojito-rest-lib','json']});

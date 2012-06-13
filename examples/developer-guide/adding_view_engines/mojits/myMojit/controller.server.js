YUI.add('myMojit', function(Y, NAME) {

  Y.mojito.controllers[NAME] = {

    init: function(config) {
      this.config = config;
    },
    index: function(ac) {
      ac.done("Mojito is working.");
    },
    default_ve: function(ac) {
      ac.done({
        "title": "Mustache at work!",
        "view_engines": [
          { "name": "Handlebars"},
          {"name": "EJS"},
          {"name": "Jade"},
          {"name": "dust"},
          {"name": "underscore" }
        ],
        "ul": { "title": 'Here are some of the other available rendering engines:' },
      });
    },
    added_ve: function(ac) {
      ac.done({
        "title": "Handlebars at work!",
        "view_engines": [ "Mustache","EJS","Jade", "dust","underscore" ],
        "ul": { "title": 'Here are some of the other available rendering engines:' }
      });
    }
  };
}, '0.0.1', {requires: ['mojito', 'myMojitModelFoo']});

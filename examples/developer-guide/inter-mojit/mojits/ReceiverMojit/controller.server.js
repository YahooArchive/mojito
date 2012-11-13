YUI.add('ReceiverMojit', function(Y, NAME) {
  Y.namespace('mojito.controllers')[NAME] = {
    init: function(spec) {
      this.spec = spec;
    },
    "index": function(actionContext) {
      actionContext.done({title: 'This is the receiver mojit'});
    },
    show: function(actionContext) {
      var url = actionContext.params.getFromMerged('url') || "http://farm1.static.flickr.com/21/35282840_8155ba1a22_o.jpg";
      actionContext.done({title: 'Image matching the link clicked on the left.', url: url});
    }
  };
}, '0.0.1', {requires: []});

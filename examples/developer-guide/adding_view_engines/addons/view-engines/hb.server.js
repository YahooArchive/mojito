YUI.add('addons-viewengine-hb', function(Y, NAME) {

  var hb = require('handlebars'),
  fs = require('fs');
  function HbAdapter(viewId) {
    this.viewId = viewId;
  }
  HbAdapter.prototype = {

    render: function(data, mojitType, tmpl, adapter, meta, more) {
      var me = this,
      handleRender = function(output) {

                output.addListener('data', function(c) {
                  adapter.flush(c, meta);
                });
                output.addListener('end', function() {
                  if (!more) {
                    adapter.done('', meta);
                  }
                });
              };
              Y.log('Rendering template "' + tmpl + '"', 'mojito', NAME);
              var template = hb.compile(this.compiler(tmpl));
              var result = template(data);
              console.log(result);
              adapter.done(result,meta);
            },
            compiler: function(tmpl) {
              return fs.readFileSync(tmpl, 'utf8');
            }
          };
          Y.namespace('mojito.addons.viewEngines').hb = HbAdapter;
}, '0.1.0', {requires: []});

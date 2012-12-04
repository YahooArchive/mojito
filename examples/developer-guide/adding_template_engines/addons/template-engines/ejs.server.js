YUI.add('addons-templateengine-ejs', function(Y, NAME) {

  var ejs = require('ejs'),
  fs = require('fs');
  function EjsAdapter(templateId) {
    this.templateId = templateId;
  }
  EjsAdapter.prototype = {

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
              var result = ejs.render(this.compiler(tmpl),data);
              console.log(result);
              adapter.done(result,meta);
            },
            compiler: function(tmpl) {
              return fs.readFileSync(tmpl, 'utf8');
            }
          };
          Y.namespace('mojito.addons.templateEngines').ejs = EjsAdapter;
}, '0.1.0', {requires: []});

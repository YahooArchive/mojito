/*jslint sloppy:true, stupid:true, node:true */
/**
 * some sugar for instantiating a Y object and attaching any YUI or Mojito (or
 * any other local) modules to it, with useSync == true. So instead of:
 *
 *   var Y = YUI({useSync: true}).use('oop', ...);
 *   Y.applyConfig({useSync: true, modules:{'mymodule1: ...}});
 *   Y.use('mymodule1', ...);
 *
 * ...specify all modules and optional module configs in one go
 *
 *   var Y = yuiuse({oop: null, mymodule1: 'path/to/it', foo: {base:...}, ...}
 *
 * @method yuiuse
 * @param {Object} modules A hash of module names. If value is falsey, YUI
 *  will load it by name. If it's a string, it's the path of the module file to
 *  load, otherwise assume it's a modules config
 * @param {String} some_particular_yui optional require() param to load YUI lib
 *  from somewhere besides default modules.path
 * @param {Function} callback Optional for YUI().use(.. callback); Loading is
 *  synchronous if omitted
 * @return {Object} yui instance
 */
function yuiuse(modules, my_yui, callback) {
    var yui = require(my_yui || 'yui').YUI,
        names = Object.keys(modules || {}),
        local = {},
        y = yui({useSync: !callback});

    names.forEach(function (name) {
        var val = modules[name];
        if (val) {
            local[name] = typeof val === 'string' ? {fullpath: val} : val;
        }
    });

    y.applyConfig({modules: local});
    y.use(names);
    y.applyConfig({useSync: false});

    return callback ? callback(y) : y;
}

module.exports = yuiuse;

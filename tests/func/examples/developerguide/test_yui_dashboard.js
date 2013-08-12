   YUI({
        useConsoleOutput: true,
        useBrowserConsole: true,
        logInclude: { TestRunner: true }
        }).use('node', 'node-event-simulate', 'test', 'console', function (Y) {

        'use strict';
<<<<<<< HEAD
        var suite = new Y.Test.Suite("Trib App: YUI Dashboard test"),
=======
        var suite = new Y.Test.Suite("TribApp: YUI Dashboard test"),
>>>>>>> 8f63c4f... Added trib app and functional tests. The functional tests passed when I ran them.
            url = window.location.protocol + "//" + window.location.host + "/";
            suite.add(new Y.Test.Case({
              "test YUI Dashboard": function () {
              // Tests the title in HTML header
              Y.Assert.areEqual("Trib - YUI/Mojito Developer Dashboard", Y.one('head title').get('innerHTML'));

              // Tests the title within the content
              Y.Assert.areEqual("Trib - YUI Developer Dashboard", Y.one('body h1').get('innerHTML'));
            }
          }));
          Y.Test.Runner.add(suite);
        });

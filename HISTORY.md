version @VERSION@
=================

Notes
-----

* The PR [#1062](/yahoo/mojito/issues/1062) fixes the detection problems in YUI that
where causing multiple issues with Y.JSON.parse and other components. In the current
implementation, the app itself uses `require('yui')` in a traditional way to avoid any
potential issues in the future with the detection system in YUI. It also re-enabled
the ability to run YUI in debug mode in the server side if you happen to use `filter="debug"`
in `application.json` which has been broken for a long time.

Deprecations
------------

* "hybridapp" code and resources have been removed. They were purpose built for use with other cocktails components outside mojito, but their development has recently stopped.

Features
--------

Bug Fixes
---------

* [PR #1062](/yahoo/mojito/issues/1062): fixes the issue with Y.config.global after the upgrade to yui@3.9.1
* removed a few unnecessary datastructure copies


version 0.5.7
=============

Notes
------------
* A middleware called `mojito-handler-error` has been added to handle
  middleware errors. If you have redefined the middleware stack and do not have
  your own error handler, then it is your responsibility to add it so that
  errors can be handled appropriately.

* An early preview of [`mojito-cli`](https://github.com/yahoo/mojito-cli) has been published. Users can choose to try it with `npm install --global mojito-cli`. There should be no significant changes in functionality. It is intended to replace the functionality provided by installing the mojito npm package globally (which has been deprecated). Notes:
  * users install mojito-cli package globally (if they choose to in this preview release period).
  * users should install the mojito package _locally_, as an npm dependency of their application.
  * all existing mojito command line commands should continue to operate in much the same way.
  * `mojito create app Foo`, when mojito-cli has been installed, will use `npm` to install `mojito` locally automatically after generating the app files and directories.

Features
------------
* Upgraded to YUI 3.9.1
* [issue #979](/yahoo/mojito/issues/979):
  * The `mojito-handler-tunnel` middleware was refactored into a middleware
    substack that more loosens the coupling between the parsing and handling
    phases of a tunnel request. This means that applications will have an
    easier time overriding and customizing tunnel behavior.
  * The URL is now customizable per request using the `tunnelUrl` option for
    `mojitProxy.invoke()`, but is still subject to the `tunnelPrefix`
    restriction.


Bug Fixes
------------
* issue bz6160815: port argument must be an integer


version 0.5.6
=================

Notes
------------
* Mojito cli commands will be moving to a separate package `mojito-cli` in
  upcoming releases, which will be for global installation. The core mojito
  package will be for bundling with your application.

Deprecations
------------
* Mojits shipped with Mojito (like HTMLFrame, tunnel, etc) will play by the same
rules, no more conditions when we walk them. Before, those mojits were forced
to not have `res.url` because they should not be used from the client side, that's not
longer the case.

Bug Fixes
------------
* issue  #812: only walk the first/shallowest version of each package
* issue #1016: regression that prevented shaker for controllering CDN urls
* issue #1026: compatibility with Node.js 0.10 by making all mojits to play by the same rules


version 0.5.5
=================

Deprecations
------------
Performance optimizations introduced in this release have resulted in internal API changes.
This impacts 3rd party components that are using protected or internal store APIs, e.g. [Shaker](/yahoo/mojito-shaker).
A new Shaker version will be released very soon to address these changes.
In the meantime, you can follow [mojito-shaker#43](/yahoo/mojito-shaker/pull/43).

Here are details of the API changes.

* We removed store event `getMojitTypeDetails`. The replacement is [`resolveMojitDetails`](http://developer.yahoo.com/cocktails/mojito/api/classes/ResourceStore.server.html#event_resolveMojitDetails), though the datastructure is different.
* We removed store event `mojitResourcesResolved`.
* We removed `store.getResources()`.
* We added `store.optimizeForEnvironment()`.
* We added `store.makeStaticHandlerDetails()`.
* `store.yui.getAllURLResources()` is now called [`store.yui.getAllURLDetails()`](http://developer.yahoo.com/cocktails/mojito/api/classes/ResourceStore.server.html#method_getAllURLDetails) and returns a different datastructure.
* For both [`store.getResourceContent()`](http://developer.yahoo.com/cocktails/mojito/api/classes/ResourceStore.server.html#method_getResourceContent) and [`store.procesResourceContent()`](http://developer.yahoo.com/cocktails/mojito/api/classes/ResourceStore.server.html#method_processResourceContent), the datastructure representing the resource has changed.
* [`store.getResourceVerions()`](http://developer.yahoo.com/cocktails/mojito/api/classes/ResourceStore.server.html#method_getResourceVersions) should not be called during runtime. It can still be called during the events that happen during preload.
* [`store.yui.getConfigShared()`](http://developer.yahoo.com/cocktails/mojito/api/classes/RSAddonYUI.html#method_getConfigShared) now just takes the `env` argument.
* We removed `store.yui.getConfigAllMojits()`.  Some users were calling `getConfigAllMojits` and using the results with `getConfigShared` to configure a YUI instance.  Now instead we suggest using `getModulesConfig()` to replace this pair of calls.
* We added [`store.yui.getModulesConfig()`](http://developer.yahoo.com/cocktails/mojito/api/classes/RSAddonYUI.html#method_getModulesConfig).
* We added [`store.yui.getYUIConfig()`](http://developer.yahoo.com/cocktails/mojito/api/classes/RSAddonYUI.html#method_getYUIConfig).
* [`store.yui.getAppSeedFiles()`](http://developer.yahoo.com/cocktails/mojito/api/classes/RSAddonYUI.html#method_getAppSeedFiles) now takes a yui configuration as the second argument.
* `store.yui.getYUIURLResources()` is now called `store.yui.getYUIURLDetails()` and returns a different datastructure.

Please see the API docs for details of each.

Features
------------
* Global models thru `ac.models.expose()` upgraded from experimental to beta.
* Support for Handlebars helpers through `mojito-helpers-addon` and support for global Handlebars helpers using `ac.helpers.expose()`. This is an experimental feature!
* Introducing error propagation in `mojito-composite-addon` by using the flag `propagateFailure` in a child.
* Introduced a clear separation between YUI core modules and app-specific YUI modules. YUI core modules are now served from CDN by default; they are only served by the app origin server if `staticHandling.serveYUIFromAppOrigin` is set in `application.json`. This change optimizes the initial load time of the app as well as its offline capabilities when using [mojito build html5app](http://developer.yahoo.com/cocktails/mojito/docs/reference/mojito_cmdline.html#build-system). 
* Improved Resource Store: minimized memory footprint.
* Upgraded to YUI 3.8.1

Bug Fixes
------------
* [#25](/yahoo/mojito/issues/25) mojito-composite-addon error propagation
* [#293](/yahoo/mojito/issues/293) HTMLFrameMojit should honor child metas
* Fixes the `Cache-Control` header for static assets.
* Fixed hybrid build issue
* Fixed lingering occurrences of `store.yui.getConfigAllMojits()`
* Fix for `forceRelativePaths` for YUI loader when using `mojito build`, making root and base to be relative when needed.
* (sweetandsour2) Fix for client side hooks, bug fix in template hooks.


version 0.5.4
=================

Deprecations
------------
* We dropped the Mu library in favor of Handlebars -- Handlebars is used everywhere, including for parsing Mu templates.
Even though Mustache is a subset of Handlebars, this might introduce some encoding issues, especially because Handlebars does automatic encoding of `{{}}` sections to provide some basic security against script injections.
If you are encoding data in your controller for your Mustache views, you no longer need to do so, and by using `{{}}` you will be covered.
On the other hand, if you don't want Handlebars to apply the default encoding, just use `{{{}}}` to print the original value.

Features
------------
* Support for Handlebars partials
* Dropped Mu library: any `*.mu.html` view/template will be processed using HB engine
* Global models thru `ad.models.registerGlobal`
* Templates warm-up thru `preloadTemplates` configuration for small apps.
* Support for external URLs in `yui.config.seed` for custom YUI versions on the client side.

Bug Fixes
------------
* Solving conflits generated by the hook system.
* lock yahoo-arrow version to 0.0.73
* Revert "Reduced memory consumption at server start by removing an apparently unnecessary meta-data copy operation..."
* adding support for a more flexible seed structure to support external urls. this helps to control the yui version on the client.
* removing mustache engine in favor of handlebars based on [#367](/yahoo/mojito/issues/367) by @mridgway
* supporting registration of global models
* consolidating application.json->viewEngine->cacheTemplates as a static config across the board.
* adding support for partials in the store. Views within partials/* folder are now considered partials.


version 0.5.3-1
=================

Bug Fixes
------------
* Revert 3a5822a "Reduced memory consumption at server start by removing an apparently unnecessary meta-data copy operation"


version 0.5.3
=================

Features
------------
* new mojito and mojito-app instrumentation hooks
* performance improvements
* simplification of the frame mojit to facilitate inheritance and brand new frames per app.

Bug Fixes
------------
* [#919](/yahoo/mojito/issues/919) Added examples of YAML configuration and linked…
* [#928](/yahoo/mojito/issues/928) Remove Y! copyright from generated code
* [#954](/yahoo/mojito/issues/954)  fix for app failures when deploying to nodejitsu.


version 0.5.2
=================

Features
------------

### Performance Improvements

From `0.5.1` to `0.5.2` we have implemented a series of micro-optimizations.
As a result, Mojito is twice as fast, uses half the memory footprint, and takes half the time to boot the application based on our internal metrics.
More information can be found on our [Trello board](http://tinyurl.com/axvd3tt).
This improves the response time to ~40ms response time for an application with 52 mojits, which represents less than 1ms per mojit.

### Comments in JSON files and YAML Support

Configuration files, including `application.json`, `defaults.json`, `definition.json`, etc., can become pretty big for complex applications, and not having comments can drastically impact productivity and on-boarding for new developers.
As of this version, we support comments in those files.
The comments are YAML comments, they start with `#`.

As well, we just brought back support for `.yml` and `.yaml` that was previously introduced in Mojito `0.4.x`.

### Logs Formatter

In `0.5.0`, we removed the mojito `logger` and started using `YUI Log` in its pure form.
As a result of the formatting process implemented by the `yui-log-nodejs` module, the logs were formatted even when the application was running in a runtime without `tty`.
This was partially fixed in this new version (for runtime execution where performance is critical), and we plan to finish the migration for the Resource Store's logs in `0.5.3`.


Bug Fixes
------------
* [bz5667423] Add support for including files in a configuration bundle
* Added support for JavaScript-style comments in JSON files
* [bz5964521] test output is always colorized -- includes escape codes when saved to file
* micro-optimization: replacing runInNewContext with runInContext
* fix two newsboxes unit tests, misc
* update copyright to 2013
* [doc] Added FAQ about setting expiration of a cookie.
* update package.json in archetypes for mojito 0.5.x & node >0.6
* do not colorize test.js output if there is no tty [gh809,bz5964521]
* Functional test changes to support SD
* jslint tests along with template for general cli testing
* [bz6023234] prefix for hybridapp/crt "//yahoo.com"
* Update docs/dev_guide/getting_started/mojito_getting_started_tutorial.rst
* removed shelljs
* honor --descriptor for --cli and --unit as well
* Travis cleanup
* [doc] Updated documentation for running Mojito's built-in unit/functional tests.
* more unit tests for ActionContext
* Update docs/dev_guide/intro/mojito_apps.rst
* Add more unit tests for params.common and view engine handlebar
* a little more careful about transforming ac.done() into a no-op
* Update docs/dev_guide/intro/mojito_mvc.rst
* [doc] Documentation for how to configure YUI for Mojito applications.
* Update docs/dev_guide/intro/mojito_mvc.rst
* unit tests for `build/*.js`
* supporting yui.config.groups.app.comboSep=& without mangling
* dispatcher coverage
* .travis.yml debug, misc
* Update docs/dev_guide/topics/mojito_testing.rst
* Update docs/dev_guide/intro/mojito_binders.rst
* Add more unit tests for util.
* fixed client-side unit tests
* Modify files to workaround a jslint error
* [gh238] [bz5667423] support for multiple application configuration files
* fix missing snapshot.packages in build hybridapp
* [doc] Added links to archived docs.
* unformatted logs when running in production systems
* Update docs/dev_guide/code_exs/calling_yql.rst
* add unit test for version
* [doc] Docs add links to presentation given by Caridy at YUIConf 2012.
* Update docs/dev_guide/reference/mojito_troubleshooting.rst
* re-enable yaml support
* [doc] Added FAQ discussing how to re-use and extend mojits.
* workaround how arrow is tweaking with console.debug()


version 0.5.1
=================

Notes
------------
* `mojito compile rollups` command is no longer needed and has been removed -- comboing is now done at request time.
* `mojito compile` commands are deprecated in favor of [Shaker](/yahoo/mojito-shaker)
* for hybridapp builds, the application.json config `builds.hybridapp.forceRelativePaths: true` is broken for the time being. This makes testing with a browser in a non-chrooted more difficult.
* NOTICE: 0.5.x has various configuration and API changes from 0.4.x, please also review [0.5.0 release notes](ReleaseNotes0_5_0) if you are upgrading your application from pre-0.5.x versions.

Features
------------
* comboing of mojito and application javascript files are at request time
* improved performance/latency
* improved internal test and testability
* improved 0.5.x documentation

Bug Fixes
------------
* fix issue #835 more careful about caching results of expandInstanceForEnv()
* adjusting ac.url.make routine to avoid accepting strings for querystring. avoiding any parsing or stringifing routine at…
* fix mojito create -p option - add {{port}} to application.json
* fix resolve loader config for hybridapp/IDE/CRT in 0.5.x
* fix input handling and error message for jslint mojit command
* better support of older browsers
* HTMLFrameMojit title now says 'Powered by Mojito', not 'Powered by Mojito 0.2'


version 0.5.0
=================

Notes
------------
* **IMPORTANT** This release contains notable backward-incompatible changes, all for the sake of significantly increased performance.

Backward Compatibility Changes
--------------------------------

### Mojito No Longer Adds Common ActionContext Addons

In the past, a subset of the addons provided by Mojito framework were attached on every `ActionContext` object (which are created per request, per mojit instance in the page).
The specific list was mojito-config-addon, mojito-url-addon, mojito-assets-addon, mojito-cookie-addon, mojito-params-addon, mojito-composite-addon.
This resulted in overhead for every mojit in the page.
As part of 0.5.0, all requirements have to be specified in the controller definition. e.g:

    YUI.add('Foo', function(Y, NAME) {

        Y.namespace('mojito.controllers')[NAME] = {

            index: function(ac) {
                // ac.params.* is now available
            }

        };

    }, '0.0.1', {requires: ['mojito', 'mojito-params-addon']});

As of 0.5.0, no addon is attached unless it is required. The only public members of `ActionContent` object are `ac.done`, `ac.error`, and `ac.flush`.

Recommendations to upgrade:

* check every controller in your app, and check if it is using `ac.*`, and add the corresponding requirements.
* the most common addons are: config, params, url, assets.


### Access to Models via a Property

Models are no longer computed and attached to `ActionContext` by default.
In other words, `ac.models.foo` is no longer a valid way to access a model.
Computing and attaching models automatically, even when they were not really needed, added overhead during the page rendering process.
Instead, we want Mojito to be more strict in defining and exposing structures automatically.

In 0.5.0, if you need to use a model in a controller (defined at the mojit level, or at the application level), you need to:

* require a new addon called `mojito-models-addon` in your controller.
* require the module in your controller.
* use `ac.models.get('foo')` to get a reference of the model.

Here is an example:

    YUI.add('DemoModelFoo', function(Y, NAME) {
        Y.namespace('mojito.models')[NAME] = {
            init: function(config) {
                this.config = config;
            },
            getData: function(callback) {}
        };
    }, '0.0.1', {requires: []});

    YUI.add('Foo', function(Y, NAME) {
        Y.namespace('mojito.controllers')[NAME] = {
            index: function(ac) {
                ac.models.get('DemoModelFoo').getData(function (data) {
                    // data from model available here
                });
            }
        };

    }, '0.0.1', {requires: ['mojito', 'mojito-models-addon', 'DemoModelFoo']});

> Note: the model name doesn't have to match the yui module name for the model anymore.


### `init` Method in Controllers is Gone

The `init` method on the controller is now deprecated and should be removed.
In many cases, the `init` method was just storing a reference of the `config` parameter to use it later on.
This is no longer available, and the `init` method will not be executed.

If you need to access the mojit `config` in an actions, you should:

* require `mojito-config-addon` in the controller.
* use `ac.config.get()` to get the `config`

> Note: do not try to store a reference of that config, as it is not safe, More details below.


### `ac.app.*` is Gone

For performance reasons, to avoid computing app config per mojit instance, per request, when the majority of the time it is not needed, we completed the transition to `mojito-config-addon` add-on.
This change affects `ac.app.*`, specifically `ac.app.config` which was commonly used to access the computed `application.json` configuration per `context`.
If you need to access the application `config` in an action or another add-on, you should:

* require `mojito-config-addon` in the controller.
* use `ac.config.getAppConfig()` to get the former `ac.app.config`


### Controllers Can No Longer Run Forever

Mojito now imposes a timeout on the dispatch of the action in the controllers.
Starting with 0.5.0 there is a "reaper" which imposes a timeout.
Actions must call `ac.done()` or `ac.error()` before the timer expires or the system will log a warning and invoke `ac.error()` with a timeout error.

This can be configured by the `actionTimeout` setting in `application.json`.
It contains the maximum number of milliseconds that a controller action is allowed to run before the action is timed out.
The default value is `60000` (60 seconds).


### Mojit and AC Addon Naming Conventions Changes

Mojito is more restrictive in how you names mojits and add-ons. There are 4 new rules:

* `addon` namespace should match the filename. E.g. `ac.foo` corresponds to `addons/ac/foo.common.js`.
* The name of the mojit, which is the name of the folder, should match the language bundle, including the filename of the bundle and its definition. E.g. `Foo` mojit can have `lang/Foo_da-DK.js`, and the content should be `YUI.add('lang/Foo_da-DK', function (Y) { Y.Intl.add('Foo', 'da-DK', {}); });`
* Controller YUI module name should be same as directory.
* YUI modules need to have unique names, regardless of selector.


### `log` Config in `application.json` is Gone

In previous versions, the console log was separated for client and server, and between Mojito and YUI.
We decided to leverage the YUI Logger, and unify this setting under a single configuration, actually the YUI configuration in `application.json`:

    "log": {
        "client": {
            "level": "error",
            "yui": false
        },
        "server": {
            "level": "error",
            "yui": false
        }
    }

is now:

    "yui": {
        "config": {
            "debug": true,
            "logLevel": "error"
        }
    }

and we recommend this setting for production:

    "yui": {
        "config": {
            "debug": false,
            "logLevel": "none"
        }
    }

To customize this for client or server, you can use the runtime context.
Also, you can now use `logExclude` and `logInclude`.
More information at http://yuilibrary.com/yui/docs/api/classes/config.html.


### Other Settings Changes in `application.json`

The following are gone:

* `embedJsFilesInHtmlFrame`
* `shareYUIInstance`
* in the `yui` section:
    * `base`
    * `dependencyCalculations`
    * `extraModules`
    * `loader`
    * `url`
    * `urlContains`


### `mojito test` No Longer Tests the Framework

In the past, `mojito test` without any other parameter was running all unit tests for mojito framework, and this is no longer the case.
We moved all the tests to `arrow`, more details here: https://github.com/yahoo/mojito/tree/develop/tests

You can continue using `mojito test app path/to/app` and `mojito test mojit path/to/mojit`, and the behavior is still the same.

> Note: this change is only relevant for contributors.


### `.guid` is Gone
The `.guid` member of Mojito metadata (such as binder metadata) is now gone.
Often there's an associated member which more specifically expresses the intent of the unique ID (for example `.viewId` or `.instanceId`).

Features
------------
* Speed: TODO more details.
* Logging now uses `Y.log()` directly, instead of our own wrapper.  This simplifies usage and enables subscribing to the YUI log events.
* Upgraded `yui` dependency to `3.7.3` (or greater).
* Combo handling is now built in to Mojito server.
* New hybrid app archetype to help create apps for use in technologies such as phonegap.

Bug Fixes
------------
* [#70](/yahoo/mojito/issues/70) Simplify logging
* [#525](/yahoo/mojito/issues/525) example unit tests crash or fail
* [#651](/yahoo/mojito/issues/651) Expanded instances are bleeding
* [#736](/yahoo/mojito/issues/736) Content Error in documentation
* bz5472979 server resources in build
* bz5886351 cli bin/mojito uses wrong copy
* bz5892364 (archetype) mojito-client not loaded for hybrid app
* bz5904449 garbled console output on node 0.8+
* bz5914052 do real buffer calculus for better UTF8 and binary support


version 0.4.9
=================

Notes
------------
* Command line warning and error output used to go to stdout, they now go to stderr.
* Version 0.4.9-2 fixes the output of the test coverage report for `mojito test -c app .`, which was incorrect for 0.4.9.

Features
------------
* New `mojito build hybridapp`, requires snapshot name and tag options.

Bug Fixes
------------
* Add yuitest-coverage dependency.
* Add yaml suport, including work from pr580 and pr670.
* Fix bz4404935, including work from pr580 and pr670
* Non-functional changes to cli fixes issue #715 typo in info error msg.
* Fix bz5895425 resources for hybridapp/crt were 500/not found as web app.
* Fix bz5904449 garbled console output on node 0.8+ if process.stdout is not a tty (i.e. a pipe) the console.log interpreted…
* Fix bz5898249 merge source application.json's build.hybridapp.packages object into the build's ./appname/package.json dependencies…
* Fix bz5472979 server resources in build server affinity resources do not need to be uri addressable. with this change store.getAllUrls()…
* Fix bz5886351 cli bin/mojito uses wrong copy.
* Fix bz5892364 (archetype) mojito-client not loaded for hybdridapp.
* Fix bz5886351 cli: bin/mojito launches wrong copy the cli entry point bin/mojito should always load and run the code.


version 0.4.8
=================

Notes
------------
* All performance regressions will be addressed in an upcoming release.

Features
------------
* [#643](/yahoo/mojito/issues/643) new `hybrid` archetype 
   * new archetype: mojito create app hybrid myapp
   * new build type: mojito build hybrid path/to/packages/dir
   * new custom archetypes: mojito create custom path/to/your/archetype mything

Bug Fixes
------------
* [#645](/yahoo/mojito/issues/645), bz5472979 fix server resources in build
* [#650](/yahoo/mojito/issues/650) [docs] Added a prereq for doing the code example, added a link
* [#546](/yahoo/mojito/issues/546) multiple jslint errors in developer-guide and getting-started code examples
* [#547](/yahoo/mojito/issues/547) errors in basic_yql example (getting-started-guide/part2)
* [#570](/yahoo/mojito/issues/570) documentation - add api_key to the binders/index.js in the code example on Binding Events
* fix path for create mojit.


version 0.4.7
=================

Notes
------------
* **IMPORTANT - server.js compatibility changes**
This release requires changes to any application's index.js file and server.js file to properly launch.
The templates in `mojito/lib/app/archetypes/app/default` for index.js and server.js are the appropriate content to use in any existing applications.
For new applications these files are automatically used when the `mojito create app` command is invoked to create a new application.

Features
------------
* [#565](/yahoo/mojito/issues/565) Added support for `/crossdomain.xml` and `/robots.txt`

Bug Fixes
------------
* [#525](/yahoo/mojito/issues/525) `mojito test app|mojit` failed for archetype-code…
* [#615](/yahoo/mojito/issues/615) [doc] Added func/unit test instructions.
* [#546](/yahoo/mojito/issues/546) multiple jslint errors in developer-guide
* [#621](/yahoo/mojito/issues/621) [docs] Fixed a syntax issue for using run.js.
* [#624](/yahoo/mojito/issues/624) Add getter to avoid exposing `_app` for Manhattan use.
* [#625](/yahoo/mojito/issues/625) Move app init so any `getHttpServer` call returns initialized app instance...
* [#598](/yahoo/mojito/issues/598) The routing configuration documentation covers the 'regex' property.
* [#628](/yahoo/mojito/issues/628) Fix start logic.
* [#602](/yahoo/mojito/issues/602) Rewrote item in the FAQ regarding passing data from the controller to the binder.


version 0.4.6
=================

Notes
------------
* All performance regressions will be addressed in an upcoming release.

Deprecations
------------
As of this release, Mojito has changed the way the application boots up. Update the file `server.js` that is at the root dir of your application. Here is an example:

   ```javascript
   var Mojito = require('mojito');
   var app = Mojito.createServer({
       context: {}
   });
   // Mojito 0.4 and 0.5 compatibility...
   module.exports = app.start ? app.start() : app;
   ```

Features
------------
* [#265](/yahoo/mojito/issues/265) Mojito can now be started using the standard node command.

Bug Fixes
------------
None.


version 0.4.5
=================

Notes
------------
* Some performance regressions remain from 0.4.0 and will be addressed in an upcoming release.

Features
------------
* Improved JavaScript parse error messages.
* Improved functional test stability.

Bug Fixes
------------
* [#13](/yahoo/mojito/issues/13) ContextController cache never cleans up
* [#461](/yahoo/mojito/issues/461) build html5app command - the "builds.html5app" key in "application.json" is not context aware
* [#482](/yahoo/mojito/issues/482) improve error handling and messaging
* [#496](/yahoo/mojito/issues/496) Compatibility with Node.js 0.8
* [#507](/yahoo/mojito/issues/507) Add "hi" group in dimensions.json
* [#508](/yahoo/mojito/issues/508) better error message for javascript parse errors
* [#519](/yahoo/mojito/issues/519) Adds a --path option to run.js to allow specifying a path to find the test descriptors or applications
* [#522](/yahoo/mojito/issues/522) fixed multiple typos in the code example as well as typo in explanation
* [#547](/yahoo/mojito/issues/547) Updated YQL key used for examples


version 0.4.4
=================

Notes
------------
* Some performance regressions remain from 0.4.0 and will be addressed in an upcoming release.

Features
------------
* [Arrow](/yahoo/arrow) unit and functional tests are run by [Travis](http://travis-ci.org/yahoo/mojito).

Bug Fixes
------------
* [#438](/yahoo/mojito/issues/438) [Shaker](/yahoo/shaker) 2.0 compatibility
* [#78](/yahoo/mojito/issues/78) Client resource store implementation
* [#77](/yahoo/mojito/issues/77), [#76](/yahoo/mojito/issues/76) YUIDocs for resource store
* [#429](/yahoo/mojito/issues/429) PUT requests not handled correctly
* Fixed a browser incompatibility with XML output
* fixed how commands instantiate the store
* performance: use Y.mojito.util.copy() instead of Y.clone()
* performance: removed Y.clone() from YCB library
* fix multiple done() calls in client-side Handlebar renderer, consequence of fixing [#408](/yahoo/mojito/issues/408) 


version 0.4.3
=================

Bug Fixes
------------
* Fix buffer mojito040
* add node 0.8 compatibility
* Travis CI Configuration
* fix broken UTs in mojit skeletons
* Fixed examples so that they should work with shareYUIInstance
* Remove YCB and depend on ycb npm package
* honoring context.lang in the loader
* Fix for handlebar renderer when ac.flush() is called more than once
* Moved fixtures; Migrated resource store addon tests
* change example & fixture mojito dependency to >0.3
* Store client url fix
* Remove i13n from public mojito
* fix store unit test
* fix (and un-ignore) the resource store unit test for optional YUI modules
* Remove i13n from public mojito
* make nice names for the pids


version 0.4.2
=================

Notes
------------
* This release is the bleeding edge of our development tree. To install the most stable, production-ready Mojito release, use `npm install mojito@stable`.

Features
------------
### Handlebars

Handlebars is now supported and is the default view engine for new projects. We are also recommending that projects change their view engine from Mustache to Handlebars for performance and stability reasons.
Big thanks to [Caridy Patino](/caridy) for this contribution.

* Made handlebars the default renderer for new projects and all examples [#365](/yahoo/mojito/issues/365)
* Added deprecation warning for Mu [#369](/yahoo/mojito/issues/369)
* [#270](/yahoo/mojito/issues/270): Added unit tests for client and server handlebars engines
* Added client side handlebars engine; Cleaned up jslint errors with server side engine
* cleaning up the handlebar wrapper for mojito as a view engine for the server side.
* adding support for handlebars for the server runtime only for now.

### Reason Phrase

Providing the ability to provide a `reasonPhrase` property when calling `ac.error`.

* [#273](/yahoo/mojito/issues/273), [#300](/yahoo/mojito/issues/300) allow custom `reasonPhrase` in ac.error -- Thanks [Fabian Frank](/FabianFrank)!

### shareYUIInstance

It was discovered that `shareYUIInstance` was not usable in previous versions.
We have addressed some of the issues such that `shareYUIInstance` should be usable, although should be considered experimental.
This configuration now works in the following way: 

Default value is `false` at app level, mojits can override the app config by specifying `shareYUIInstance` in their defaults.json (parallel to the config key).

* [#357](/yahoo/mojito/issues/357), [#386](/yahoo/mojito/issues/386): Fixed `shareYUIInstance` 

### Docs

* Reorganized the document, added links to images, section IDs, rewrote sections, and edited.
* Adding architecture images.
* Added a link to the RS from the selector property and an example that you cannot add the selector * property to the defaults.json file of a mojit.
* Added the 'selector' property to the config docs and made a note in the RS docs that the selector can only be set in application.json.
* Added the --context option to the build and start commands.
* Added the tunnelTimeout property to the application config object.

Bug Fixes
------------
* fix [#375](/yahoo/mojito/issues/375), unified handling of frameworkName, appName, and prefix [#383](/yahoo/mojito/pull/383)
* Set server runtime when handling tunnel calls. [#242](/yahoo/mojito/issues/242) - Thanks Fabian Frank!
* jslint command now uses node-jslint npm module; Fixed jslint errors from jslint upgrade [#360](/yahoo/mojito/issues/360)
* [#352](/yahoo/mojito/issues/352) archetypes now specify a version of mojito similar to that which uses them [#355](/yahoo/mojito/issues/355)
* when using the loader at the server side to generate combo urls we should pipe the yui config into the loader settings otherwise some settings will not be honored. [#350](/yahoo/mojito/issues/350)
* guard against missing edges in `mojito gv` [#349](/yahoo/mojito/issues/349)
* Removed DaliProxy and adding application configurable tunnel timeout [#345](/yahoo/mojito/issues/345)
* [Fix bz5712477] Make sure to callback when there is an error [#338](/yahoo/mojito/issues/338)
* Porting mojito doc over to the new yuidocjs [#243](/yahoo/mojito/issues/243) - Thanks Fabian Frank!
* [#270](/yahoo/mojito/issues/270): Added unit tests for client and server handlebars engines
* [#357](/yahoo/mojito/issues/357), [#386](/yahoo/mojito/issues/386): Fixed `shareYUIInstance` 


version 0.4.0
=================

Notes
------------
* This release contains a significant rewrite of an important subsystem of Mojito, the resource store.
Also, with this release, the resource store becomes part of the public API of Mojito.
It's an advanced feature, however, and is only needed if you intent to change how Mojito interprets and uses files on the filesystem.

Deprecations
------------
* You will now need to configure the iphone selector by hand (`{"settings": ["device:iphone"], "selector":"iphone"}`) in your `application.json` files.  (This resource store no longer assumes the selector is just the device.)
* In a mojit's `package.json`, the version check is now spelled `engines.mojito` instead of `yahoo.mojito.version`.
* In a mojit's `package.json`, `config.mojito` is now spelled `yahoo.mojito`.
* The second argument to `serializeClientStore()` is gone.  (This was pretty much internal to mojito anyway, so likely no one will miss it.)
* The second argument to `getAppConfig()` is gone.  That method now *just* returns the application configuration (from `application.json`). (This was pretty much internal to mojito anyway.)

Bug Fixes
------------
* issue [10](/yahoo/mojito/issues/10): Ensure Mojito can handle YUI module names with underscores
* issue [32](/yahoo/mojito/issues/32): "mojito compile rollups" using dot notation in the name of the css files will make compile to discard some of them
* issue [50](/yahoo/mojito/issues/50): mojito start loads tests from addons
* issue [54](/yahoo/mojito/issues/54): "mojito compile inlinecss" has unexpected behavior when there is a css file name that contains the string "iphone"
* issue [59](/yahoo/mojito/issues/59), bz 5380714: test files under addons/ac/ are loaded when mojito starts
* issue [95](/yahoo/mojito/issues/95), bz 4647440: Proper Mojito version number comparison
* issue [109](/yahoo/mojito/issues/109): Refactor certain complicated parts of the store
* issue [110](/yahoo/mojito/issues/110): Detect duplicate resource ids on cookdown
* bz 4647169: considering making a utility YUI object in ResourceStore
* bz 5362206: Need ability to select controller, view, model and binder based on context
* bz 5495519: mojito is not loading - stuck retrieving all the datetype-date-format for each locale
* bz 5530096: Mojito tries to parse .json~ files in [mojit]/specs/
* bz 5541500: mojito not doing fallback
* bz 5609501: L10n: Root strings file is not used by default when a non-root strings file is present 


version 0.3.30
=================

Notes
------------
* Mojito depends on the latest patch release of YUI, currently YUI 3.5.1-2.
This version of YUI fixes a [Y.io issue](/yui/yui3/commit/4b03344978520a7e55dd70f461b21cf81f33aeac) which appeared in the last release.
Also, as with the last Mojito release, YUI 3.5.x has removed built-in jsdom support.
Server code that depends on a DOM will cause Mojito to throw an exception on startup.
A warning will now be issued for known DOM dependent modules matching this criteria.
Folks are asked to either move DOM dependencies to client affinities or binders, or create the required host objects for your application's DOM requirements.
See [http://yuilibrary.com/yui/docs/yui/nodejs.html](http://yuilibrary.com/yui/docs/yui/nodejs.html).
There may also be other app-specific issues with the upgrade in YUI.

Deprecations
------------

Features
------------
* Add --print option to jslint usage message
* Performance Optimization: Defer RouteMaker Instantiation in URL Addon
* yuitest cleanups
* rm local copy of mime, use npm mime module instead
* Remove local glob.js and replace with glob npm package
* Added client-side unescape of escaped content
* Adding namespacing to Mojito components
* lots of documentation updates

Bug Fixes
------------
* Alter escaping to URI escaping to repair regressions
* Make sure the callback signature is what the supplied Function expects
* Use command-line context in "mojito build html5app" command


version 0.3.29
=================

Notes
------------
* Mojito depends on the latest patch release of YUI, currently YUI 3.5.1-2.
This version of YUI fixes a [Y.io issue](/yui/yui3/commit/4b03344978520a7e55dd70f461b21cf81f33aeac) which appeared in the last release.
Also, as with the last Mojito release, YUI 3.5.x has removed built-in jsdom support.
Server code that depends on a DOM will cause Mojito to throw an exception on startup.
A warning will now be issued for known DOM dependent modules matching this criteria.
Folks are asked to either move DOM dependencies to client affinities or binders, or create the required host objects for your application's DOM requirements.
See [http://yuilibrary.com/yui/docs/yui/nodejs.html](http://yuilibrary.com/yui/docs/yui/nodejs.html).
There may also be other app-specific issues with the upgrade in YUI.
* Because of the YUI situation, both the latest and stable tags on npm point to Mojito 0.3.26.
To install this release you need to specify version 0.3.29 explicitly (either `npm i mojito@0.3.29` or via package.json).

Bug Fixes
------------
* fixed the HelloMojit-tests in the default mojit archetype to prevent a test failure when running `mojito test app .` (as indicated in the Getting Started tutorial).  The objects are not equal even if they have the same elements
* updated controller.server.js and controller.server-tests.js code examples in getting_started to reflect the files generated by mojito 0.3.26
* [bz5472517] Error on server doesn't propagate to client


version 0.3.28
=================

Notes
------------
* Mojito depends on the latest patch release of YUI, currently YUI 3.5.1-2.
This version of YUI fixes a [Y.io issue](/yui/yui3/commit/4b03344978520a7e55dd70f461b21cf81f33aeac) which appeared in the last release.
Also, as with the last Mojito release, YUI 3.5.x has removed built-in jsdom support.
Server code that depends on a DOM will cause Mojito to throw an exception on startup.
A warning will now be issued for known DOM dependent modules matching this criteria.
Folks are asked to either move DOM dependencies to client affinities or binders, or create the required host objects for your application's DOM requirements.
See [http://yuilibrary.com/yui/docs/yui/nodejs.html](http://yuilibrary.com/yui/docs/yui/nodejs.html).
There may also be other app-specific issues with the upgrade in YUI.

Features
------------
* [726a2e4](/yahoo/mojito/commit/726a2e4) Added -p option for jslint results to sdtout

Bug Fixes
------------
* [#231](/yahoo/mojito/issues/231) Update sys references to util references.
* [#219](/yahoo/mojito/issues/219) [bz5651900] stop mojit data memory leak - record dynamically 
* [#223](/yahoo/mojito/issues/223) [bz5646042] log warning if server mojit has DOM dependency.
* [#232](/yahoo/mojito/issues/232) [bz5649382] Fix for `mojito test app`.
* fix dynamic mojit regression introduced in [2dd7313](/yahoo/mojito/commit/2dd7313)
* fix unit test errors in build 130
* [bz5491914] Fix client exception on `ac.error()`
* [bz5649346] Updates yui and yuitest dependencies; +FreeBSD
* [bz5494997] Fix for Mojito client throwing on tunnel timeout
* More null fixes for Mustache 
* [bz5590319] Unicode and/or HTML escaping for config data.



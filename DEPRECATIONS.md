
As Mojito matures, there are a number of changes/cleanups that we want to make
that break backwards-compatilibity.  However, we don't want to prevent you from
upgrading in a timely fashion, so that you can use the latest and greatest
version of mojito.

To enable both our needs and yours, we need a clear, predictable path into the
future.



Deprecated but Available
========================

* (2012-08-13) Files ending in `.mu.html` will eventually not be rendered
out-of-the-box by Mojito. All downstream projects should use the Handlebars
view engine by renaming all view files from `.mu.html` to `.hb.html`. All examples
and archetypes have already been updated, so new projects will use Handlebars
by default. To rename all views in your project, run the following in your project's
root folder:
`find . -name "*.mu.html" -exec sh -c 'mv "$1" "$(echo "$1" | sed s/mu.html\$/hb.html/)"' _ {} \;`


Deprecated with Warnings
========================

* (2012-12-05) the `mojito compile` command will be removed in future releases, in favor of [Shaker](/yahoo/mojito-shaker).
* (2012-04-23) `ac.dispatch()` will be going away.
Currently the best alternative is `ac._dispatch()`.


Removed
=======

### (0.5.0) Mojito `compile` command line tool no longer needs a `rollup` command

Javascript file concatenation/combo'ing of mojito files is now built-in.

### (0.5.0) Mojito No Longer Adds Common ActionContext Addons

In the past, a subset of the addons provided by Mojito framework were attached on every `ActionContext` object (which are created per request, per mojit instance in the page).
The specific list was `['mojito-config-addon', 'mojito-url-addon', 'mojito-assets-addon', 'mojito-cookie-addon', 'mojito-params-addon', 'mojito-composite-addon']`.
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



### (0.5.0) Access to Models via a Property

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



### (0.5.0) `init` Method in Controllers

The `init` method on the controller is now deprecated and should be removed.
In many cases, the `init` method was just storing a reference of the `config` parameter to use it later on.
This is no longer available, and the `init` method will not be executed.

If you need to access the mojit `config` in an actions, you should:

* require `mojito-config-addon` in the controller.
* use `ac.config.get()` to get the `config`

> Note: do not try to store a reference of that config, as it is not safe, More details below.



### (0.5.0) `ac.app.*`

For performance reasons, to avoid computing app config per mojit instance, per request, when the majority of the time it is not needed, we completed the transition to `mojito-config-addon` add-on.
This change affects `ac.app.*`, specifically `ac.app.config` which was commonly used to access the computed `application.json` configuration per `context`.
If you need to access the application `config` in an action or another add-on, you should:

* require `mojito-config-addon` in the controller.
* use `ac.config.getAppConfig()` to get the former `ac.app.config`



### (0.5.0) Controllers Can No Longer Run Forever

Mojito now imposes a timeout on the dispatch of the action in the controllers.
Starting with 0.5.0 there is a "reaper" which imposes a timeout.
Actions must call `ac.done()` or `ac.error()` before the timer expires or the system will log a warning and invoke `ac.error()` with a timeout error.

This can be configured by the `actionTimeout` setting in `application.json`.
It contains the maximum number of milliseconds that a controller action is allowed to run before the action is timed out.
The default value is `60000` (60 seconds).



### (0.5.0) Mojit and AC Addon Naming Conventions

Mojito is more restrictive in how you names mojits and add-ons. There are 4 new rules:

* `addon` namespace should match the filename. E.g. `ac.foo` corresponds to `addons/ac/foo.common.js`.
* The name of the mojit, which is the name of the folder, should match the language bundle, including the filename of the bundle and its definition. E.g. `Foo` mojit can have `lang/Foo_da-DK.js`, and the content should be `YUI.add('lang/Foo_da-DK', function (Y) { Y.Intl.add('Foo', 'da-DK', {}); });`
* Controller YUI module name should be same as directory.
* YUI modules need to have unique names, regardless of selector.



### (0.5.0) `log` Config in `application.json`

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



### (0.5.0) Other Settings in `application.json`

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



### (0.5.0) `mojito test` No Longer Tests the Framework

In the past, `mojito test` without any other parameter was running all unit tests for mojito framework, and this is no longer the case.
We moved all the tests to `arrow`, more details here: https://github.com/yahoo/mojito/tree/develop/tests

You can continue using `mojito test app path/to/app` and `mojito test mojit path/to/mojit`, and the behavior is still the same.

> Note: this change is only relevant for contributors.



### (0.5.0) `.guid`
The `.guid` member of Mojito metadata (such as binder metadata) is now gone.
Often there's an associated member which more specifically expresses the intent of the unique ID (for example `.viewId` or `.instanceId`).





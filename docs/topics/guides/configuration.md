# Configuring Mojito
Mojito can be configured at several levels.
Each level is configured differently, though they all use the same general file format.


## File Format
All configuration files in Mojito have a general top-level structure.

They are all JSON files.
At the top level they contain a list.
Each item of the list is a "section" as an object.
Each section contains a special key `settings`, which specifies under which condition the section applies.

Currently, the only supported value for `settings` is a list containing a single string `"master"`.
Any other section with different (or missing) `settings` will be ignored.

(The indended future goal is to support different sections which will be used under different conditions.
 An example might be to have some values differ based on the development/staging/production environments.)


## Application
At the application level, configuration can be given to specify how the server and client runtimes should work.

The application is configured in the `application.json` file in the application directory.
This file has the following keys:

* `appPort` -- 1–65535
   * The port number the application will use.

* `specs` -- object
   * Specifies the mojit instances.  See below.

* `mojitsDirs` -- list of directories
   * Each directory specifies where to find mojit types.
   * If a directory doesn't start with a slash, it is taken as relative to the application directory.
   * Defaults to `['mojits']`.

* `mojitDirs` -- list of directories
   * Each directory specifies where to find a single mojit type.
   * If a directory doesn't start with a slash, it is taken as relative to the application directory.
   * The mojits specified by `mojitDirs` are loaded after the mojits in `mojitsDirs`.
   * Defaults to `[]` (an empty list).

* `routesFiles` -- list of files
   * Each file specifies where to find routing information.
   * If a file doesn't start with a slash, it is taken as relative to the application directory.
   * Defaults to `['routes.json']`.
<!--
Not supported yet
* `tunnelPrefix` -- string
   * URL prefix for the communication tunnel from the client back to the server.
   * Defaults to `/tunnel/`.
-->
* `staticHandling` -- object
   * Gives details on static handling.  It has the following keys:
   * `prefix` -- string
      * URL prefix for all staticly-served assets.
      * Specified as a simple string -- will be surrounded by `/`.
         * For example `static` leads to a URL prefix of `/static/`.
      * Can be given an empty string if no prefix is desired.
      * Defaults to `static`.
   * `appName` -- string
      * Specifies the path prefix for assets that originated in the application directory, but which are not part of a mojit.
      * Defaults to the application's directory name.
   * `frameworkName` -- string
      * Specifies the path prefix for assets that originated from Mojito, but which are not part of a mojit.
      * Defaults to `mojito`.
   * `cache` -- boolean
      * When `true` cache files in memory indefinitely,
        until invalidated by a conditional GET request.
        When given, `maxAge` will be derived from this value.
   * `maxAge` -- integer
      * Browser cache maxAge in milliseconds.
      * Defaults to `0`.
   * `useRollups` -- boolean
      * When `true`, the client will use the rollup file (if it exists) to load the YUI modules in the mojit.
      * You can use the `mojito compile rollups` command to generate the rollups.
      * Defaults to `false`.

* `embedJsFilesInHtmlFrame` -- boolean
   * When Mojito is deployed to the client, specifies whether the body of the javascript files should be inlined in the page.
   * Defaults to `false`.

* `yui` -- object
   * When Mojito is deployed to client, specifies details of where/how to obtain YUI3.
   * If none of these are given then YUI3's internal defaults are used.
   * `url` - string
      * Specifies the location of the YUI3 seed file.
   * `base` -- string
      * Specifies the prefix from which to load all YUI3 libraries.
   * `loader` -- string
      * Specifies the path (appended to `base` above) to the loader to use.
   * `showConsoleInClient` -- boolean
      * Set to true if you want the YUI debuging console shown in the client.
   * `extraModules` -- array
      * Specifies, by name, extra YUI library modules that should be added to the page when Mojito is sent to the client.

<!--
* `allowQueryStringRouting` .. boolean
  * If no routes are given (in `routesFiles`) then this setting indicates whether the instance and action can be taken from query string parameters.
    The `mojit-base` query paramenter gives the mojit spec or type, and the `mojit-action` parameter gives the action.
  * Defaults to `false`.
-->


## Mojit Type
At the mojit type level, metadata about the type can be given as well as defaults for mojit instances.

### Metadata

The `definition.json` file in the mojit type directory is used to specify metadata about the mojit type.
The contents of the file override the mojit type metadata that Mojito generates from the contents of the filesystem.

The information is available in the controller via the "config" ActionContext plugin, for example `ac.config.getDefinition('version')`.

This file has the following keys:

* `appLevel` -- boolean
   * Specifies if the mojit is "app-level".
   * An app-level mojit is a mojit which is not intended to be run itself, but which provides its resources to all other mojits in the application.
   * The resources are the actions, addons, assets, binders, models, and views.  Neither configuration files nor the controller of an app-level mojit are provided to other mojits.
   * In order for another mojit to use a resource provided by an app-level mojit, the using mojit needs to add the resource's YUI module name to the YUI `requires` part of the mojit's controller.
      * For example, of `mojits/Y` is an app-level mojit and has `mojits/Y/models/foo.js`, mojit `X` needs to add the YUI module name of `mojits/Y/models/foo.js` to the YUI `requires` section of its controller found in `mojits/X/controller.common.js`.
   * Defaults to `false`.


### Instance Defaults

The `defaults.json` file in the mojit type directory can be used to specify defaults for each mojit instance of the type.
The format is the same as the mojit instance as specified in the `specs` section of `application.json`.
This means that you can specify a default `action`, as well as any defaults you might want to put in the `config` section.


## Mojit Instance
A mojit instance is made entirely of configuration.
This configuration specifies which mojit type to use and configures an instance of that type.

The mojit instances are given in the `application.json` file, under the `specs` key.

    [
        {
            "settings": [ "master" ],

            "specs": {
                "foo": {
                    "type": "MessageViewer",
                    "config": {
                        "message": "hi"
                    }
                },
                "bar": {
                    "base": "foo",
                    "config": {
                        "message": "hello"
                    }
                }
            }
        }
    ]

Each instance contains the following keys:

* `type` -- string
   * Specifies the mojit type.
   * One of `type` or `base` (see below) is requried.

* `base` -- string
   * Specifies another mojit instance to use as a "base" for this one.
     Any changes in this instance will override those in the base.
   * Only mojit instances with an ID can be used as a base.
     Only mojit instances specified at the top-level of `specs` in `application.json` have an ID.
     The ID is the instance's key in the `specs` object.
   * One of `type` (see above) or `base` is requried.

* `action` -- string
   * Specifies a default action to use if the mojit instance wasn't dispatched with one.
   * If not given and the mojit wasn't dispatched with an explicit action, the action defaults to `index`.

* `config` -- object
   * Specifies configuration for the controller.
   * This is user-defined information -- Mojito will not interpret any part of this object.
     It is for you to use to configure the controller.
     You can access this information in the controller using the "config" ActionContext plugin, for example `ac.config.get('message')`.



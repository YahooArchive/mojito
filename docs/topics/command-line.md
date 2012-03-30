# Mojito Command Line

Mojito comes with a command line tool that provides a number of key capabilities for the developer, from generating code skeletons, to running tests and test coverage, to cleaning up and documenting the code base.


## Help

To show top-level help for this command line tool:

    $ mojito help

To show help for a specific command:

    $ mojito help <command>


## Starting the server

To start the server and run the application:

    $ mojito start [<port>]

The port number specified here is an override.
If a port is not specified, the port number is obtained through the application's configuration mechanism.
If one is not found there, port _8666_ is used.


## Creating code from archetypes

Archetypes are used to create skeletons for the different types of artifacts in a Mojito application, thus saving the developer from the need to create these by hand each time.
These skeletons are not large amounts of code, but they are boilerplate, so easily created from the command line tool rather than by hand.

To create a skeleton for a Mojito application:

    $ mojito create app [<archetype-name>] <app-name>

This will create an empty application (i.e. one with no mojits) with the name provided.
The application is created in a directory named _app-name_ within the current directory.

If no archetype name is provided, the default archetype is used.

To create a skeleton for a mojit:

    $ mojito create mojit [<archetype-name>] <mojit-name>

This will create an empty mojit with the name provided.
The command assumes it is being executed within an application directory.
Thus the mojit is created in a directory named _mojit-name_ within a `mojits` subdirectory of the current directory.
(That is, a mojit `MyMojit` will be created in `mojits/MyMojit`.)

As with application creation, if no archetype name is provided, the default archetype is used.
Depending upon the archetype, the skeleton may include any or all of the controller, a model, a view and a binder.


## Current Archetypes

There are currently three archetypes for Mojito applications and mojits.

### 'simple'

The smallest amount of configuration and code to get something running.

### 'default'

This archetype is run if no command line archetype option is specified.
It is a happy medium between "simple" and "full".

### 'full'

At least one example of everything you might ever need.


## Testing code

Unit tests are run using YUI Test invoked via the Mojito command line tool.
Test output is written to the console, and also to file.
The output file locations are specified below.
Note that it is not (yet) possible to specify an alternative output location.

To run the tests for the Mojito framework itself:

    $ mojito test

Output is written to `{CWD}/artifacts/framework/test/`, where `{CWD}` is the current working directory.

To run the unit tests for a specific mojit:

    $ mojito test mojit <mojit-path> [<mojit-module>]

Output is written to `{app-dir}/artifacts/test/mojits/{mojit-name}/`.

If a mojit module (i.e. the YUI module for a portion of the mojit) is specified, only the tests for that module will be run.
Otherwise all tests for the mojit will be run.


## Code coverage

Code coverage is invoked via the Mojito command line tool.
Coverage results are written to the console, and also to file.
The output file locations are specified below.
As with unit tests, note that it is not (yet) possible to specify an alternative output location.

To run code coverage for the Mojito framework itself:

    $ mojito coverage

Output is written to `{CWD}/artifacts/framework/coverage/`, where `{CWD}` is the current working directory.

To run code coverage for a specific mojit:

    $ mojito coverage mojit <mojit-path>

Output is written to `{app-dir}/artifacts/coverage/mojits/{mojit-name}/`.


## Cleaning up the code

Static code analysis is run using JSLint invoked via the Mojito command line tool.
JSLint output is written to text files, and a jslint.html file makes it easy to navigate through the results.
The output file locations are specified below.
Note that it is not (yet) possible to specify an alternative output location.

To run JSLint on the Mojito framework code:

    $ mojito jslint

Output is written to `{CWD}/artifacts/framework/jslint/`, where `{CWD}` is the current working directory.

To run JSLint on an application, including all of its (owned) mojits:

    $ mojito jslint app <app>

Output is written to `{app-dir}/artifacts/jslint/`.

To run JSLint on a specific mojit:

    $ mojito jslint mojit <mojit-path>

Output is written to `{app-dir}/artifacts/jslint/mojits/{mojit-name}/`.


## Documenting the code

API documentation is generated using YUI Doc invoked via the Mojito command line tool.
Documentation output is written to files in the locations specified below.
Note that it is not (yet) possible to specify an alternative output location.

To generate documentation for the Mojito framework itself:

    $ mojito docs mojito

Output is written to `{CWD}/artifacts/docs/mojito/`, where `{CWD}` is the current working directory.

To generate documentation for an application, including all of its (owned) mojits:

    $ mojito docs app <app-name>

Output is written to `{app-dir}/artifacts/docs/{app-name}`.

To generate documentation for a specific mojit:

    $ mojito docs mojit <mojit-name>

Output is written to `{app-dir}/artifacts/docs/mojits/{mojit-name}/`.


## Version information

To show the version for the Mojito framework itself:

    $ mojito version

To show the version for an application:

    $ mojito version app <app>

To show the version for a mojit:

    $ mojito version mojit <mojit-path>


## Compile System

Mojito comes with a compile command for generating sections of a Mojito application which are optimized for production serving.

> Note: This command generates new files within Mojit directories.

    $ mojito compile all

To remove the files generated by the compile command you add the option "--remove". This will remove ALL the files that were generated.

    $ mojito compile all --remove

## Build System

Mojito comes with a build command for generating versions of a Mojito application that run in different environments.
The command _must_ be run inside of the application you want built.

    $ mojito build <type> [<output-path>]

Output is written to `{app-dir}/artifacts/{type}` by default.


## Current Build Types

### 'html5-app'

This generates a HTML5 Offline Application with a `cache.manifest` listing all the files that will be available offline.
An `index.html` page is generated from the result of calling the web root `/` on the Mojito application that this command was run within.



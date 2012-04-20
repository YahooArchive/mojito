# Yahoo! Mojito

Mojito is the JavaScript library implementing Cocktails, a JavaScript-based
on-line/off-line, multi-device, hosted application platform.

## Installation

### via GitHub

    $ git clone git://github.com/yahoo/mojito.git
    $ cd mojito/source
    $ npm install -g .
    $ npm install .

### via npm

    $ npm install -g mojito

## Quick Start

Create an app and install local Mojito:

    $ mojito create app hello
    $ cd hello
    $ npm install .

Create a mojit:

    $ mojito create mojit HelloMojit

Edit application.json to configure mojit so that it looks like:

    [
        {
            "settings": [ "master" ],
            "specs": {
                "hello": {
                    "type": "HelloMojit"
                }
            }
        }
    ]

Start the server:

    $ mojito start

Go to URL:

    http://localhost:8666/@HelloMojit/index

## Documentation

http://developer.yahoo.com/cocktails/mojito

## Discussion/Forums

http://developer.yahoo.com/forum/Yahoo-Mojito

## Licensing and Contributions

Mojito is licensed under a [BSD license](https://github.com/yahoo/mojito/blob/master/LICENSE.txt).

To contribute to the Mojito project, please review the [Mojito Contributor
License Agreement](http://developer.yahoo.com/cocktails/mojito/cla/).

## Third-party libraries

Mojito includes the Mulib software available here:

https://github.com/raycmorgan/Mu

## Gaurav's website

http://www.mastergaurav.com



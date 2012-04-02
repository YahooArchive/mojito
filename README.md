# Yahoo! Mojito

Mojito is the JavaScript library implementing Cocktails, a JavaScript-based
on-line/off-line, multi-device, hosted application platform.

## Installation

### via GitHub

    $ git clone git://github.com/yahoo/mojito.git
    $ cd mojito/source
    $ npm install
    $ npm ln

### via npm

    $ npm install -g mojito

## Quick Start

Create an app and install local Mojito:

    $ mojito create app hello
    $ cd hello
    $ npm install mojito

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

## Licensing

Please see the LICENSE.txt file for details.

## Third-party libraries

Mojito includes the Mulib software available here:

https://github.com/raycmorgan/Mu


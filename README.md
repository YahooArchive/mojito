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

Add a route to map "/" to your HelloMojit.index action.  Edit your routes.json so that it looks like:

```
[{
    "settings": ["master"],
    "hello index": {
        "verbs": ["get"],
        "path": "/",
        "call": "hello.index"
    }
}]
```

The "hello" in "hello.index" maps to the application.json "hello" specs property.

Go to URL:

    http://localhost:8666/

## Documentation

http://developer.yahoo.com/cocktails/mojito

## Discussion/Forums

http://developer.yahoo.com/forum/Yahoo-Mojito

## Licensing

Please see the LICENSE.txt file for details.

## Third-party libraries

Mojito includes the Mulib software available here:

https://github.com/raycmorgan/Mu


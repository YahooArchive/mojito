# Yahoo! Mojito

Mojito is the JavaScript library implementing Cocktails, a JavaScript-based
on-line/off-line, multi-device, hosted application platform.

## Installation

  $ npm install mojito

## Quick Start

  Make an app:

  $ mojito create app simple hello
  $ cd hello

  Make a mojit:

  $ mojito create mojit simple HelloMojit

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

  http://localhost:8666/hello/index

## Documentation

https://github.com/yahoo/mojito/docs/topics

## Licensing

Please see the file called LICENSE.txt

## Third-party libraries

Mojito includes the Mulib software available here:

https://github.com/raycmorgan/Mu


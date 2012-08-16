# Yahoo! Mojito

Mojito is the JavaScript library implementing Cocktails, a JavaScript-based
on-line/off-line, multi-device, hosted application platform.

[![Build Status](https://secure.travis-ci.org/yahoo/mojito.png?branch=develop)](http://travis-ci.org/yahoo/mojito)

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

Start the server:

    $ mojito start

Go to URL:

    http://localhost:8666/@HelloMojit/index

Run Unit Tests:

    $ mojito test app .

Generate documentation:

    $ mojito docs app hello

## Documentation

### General

* Mojito Home Page - http://developer.yahoo.com/cocktails/mojito
* Mojito Docs Navigation - http://developer.yahoo.com/cocktails/mojito/docs/
* Mojito FAQ - http://developer.yahoo.com/cocktails/mojito/docs/faq/
* Mojito Introduction - http://developer.yahoo.com/cocktails/mojito/docs/intro/
* Mojito Getting Started - http://developer.yahoo.com/cocktails/mojito/docs/getting_started/

### API Documentation

* Running the following command will generate API docs and locally save them to `./artifacts/docs/mojito/`
    `$ mojito docs mojito`
* View the Mojito API documentation on YDN: http://developer.yahoo.com/cocktails/mojito/api/

## Discussion/Forums

http://developer.yahoo.com/forum/Yahoo-Mojito

## Licensing and Contributions

Mojito is licensed under a [BSD license](https://github.com/yahoo/mojito/blob/master/LICENSE.txt). To contribute to the Mojito project, please see [Contributing](https://github.com/yahoo/mojito/wiki/Contributing-Code-to-Mojito). 

The Mojito project is a [meritocratic, consensus-based community project](https://github.com/yahoo/mojito/wiki/Governance-Model) which allows anyone to contribute and gain additional responsibilities.

## Third-party libraries

Mojito includes the Mulib software available here:

https://github.com/raycmorgan/Mu


# Mojit

A *Mojit* is a key part of the **Mojito** framework.

### Directory Structure

In the following `{affinity}` is `server`, `common`, or `client` to specify where the resource is available.

    /mojits
        /mojit_name
        ..../autoload
        ......../*.{affinity}.js
        ..../actions
        ......../*.{affinity}.js
        ..../assets
        ......../css
        ......../js
        ......../images
        ..../binders
        ......../{view-name}.js
        ..../lang
        ......../{mojit_name}_{lang}.js
        ..../models
        ......../model.{affinity}.js
        ..../tests
        ......../controller.server-tests.js
        ......../model.server-tests.js
        ..../views
        ......../index.mu.html
        ......../index.iphone.mu.html
        ....controller.{affinity}.js
        ....definition.json
        ....defaults.json


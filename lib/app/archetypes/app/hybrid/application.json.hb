[
    {
        "settings": [ "master" ],
        "appPort": 8666,
        "builds": {
            "html5app": {
                "urls": ["/yahoo.application.{{name}}/index.html"]
            }
        },
        "cacheViewTemplates": true,
        "deferAllOptionalAutoload": false,
        "embedJsFilesInHtmlFrame": false,
        "log": {
            "client": {
                "level": "info",
                "yui": false
            },
            "server": {
                "level": "info",
                "yui": false
            }
        },
        "shareYUIInstance": true,
        "tunnelPrefix": "/tunnel/",
        "staticHandling": {
            "appName": "yahoo.{{name}}.application",
            "cache": false,
            "frameworkName": "yahoo.{{name}}.mojito",
            "prefix": "",
            "useRollups": false
        },
        "yui": {
            "dependencyCalculations": "precomputed"
        }
    },

    {
        "settings": [ "environment:dev" ],
        "yui": {
            "base": "/yahoo.libs.yui/",
            "url": "$$yui.base$$yui/yui-min.js",
            "loader": "loader/loader-min.js"
        }
    }
]

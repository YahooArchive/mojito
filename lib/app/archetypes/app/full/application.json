[
    {
        "settings": [ "master" ],

        "appPort": "{{port}}",
        "cacheViewTemplates": true,
        "staticHandling": {
            "appName": "app",
            "frameworkName": "mojito",
            "cache": true,
            "maxAge": 600000,
            "prefix": "static"
        },
        "tunnelPrefix": "/tunnel/",
        "yui": {
            "config": {
                "debug": true,
                "logLevel": "info"
            }
        },

        "specs": {
            "frame": {
                "type": "HTMLFrameMojit",
                "config": {
                    "deploy": true,
                    "child": {

                    }
                }
            }

        }
    },
    {
        "settings": [ "environment:development" ],
        "staticHandling": {
            "cache": false,
            "forceUpdate": true
        }
    }
]

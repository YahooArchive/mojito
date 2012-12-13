[
    {
        "settings": [ "master" ],
        "appPort": "{{port}}",
        "specs": {
            "frame": {
                "base": "top_frame"
            }
        },
        "staticHandling": {
            "appName": "yahoo.application.{{name}}",
            "prefix": "yahoo.application.{{name}}"
        },
        "builds": {
            "hybridapp": {
                "forceRelativePaths": true,
                "urls": ["/yahoo.application.{{name}}/index.html"],
                "packages": {
                    "yahoo.libs.yui": "*"
                }
            }
        }
    },
    {
        "settings": ["build:debug"],
        "yui": {
            "config": {
                "base": "/yahoo.lib.yui/",
                "combine": false,
                "comboBase": "",
                "root": "",
                "groups": {
                	"app": {
                        "combine": false,
                        "comboBase": "",
                        "base": "/",
                        "root": ""
                	}
                }
            }
        }
    }
]

[
    {
        "settings": [ "master" ],

        "type": "HTMLFrameMojit",
        "config": {
            "deploy": true,
            "title": "{{name}} App",
            "child": {
                "type": "top_frame"
            }
        },
        "assets": {
            "top": {
                "css": ["./index.css"]
            }
        }
    },

    {
        "settings": ["build:debug"],

        "config": {
            "assets": {
                "bottom": {
                    "js": ["/yahoo.crt.lib/yui-cfg.js"]
                }
            }
        }
    }
]

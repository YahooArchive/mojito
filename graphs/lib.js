/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('MojitoGHGraphs', function(Y, NAME) {


    var URLS = {
            latest: 'lastbuild.txt',
            artifact: '==RECIPE==-run-==BUILD==.json'
        };


    function toKilobytes(bytes) {
        return Math.round(bytes / 102.4) / 10;
    }


    // returns promise
    function getLatest() {
        return new Y.Promise(function(fulfill, reject) {
            var url = URLS.latest;
            url += '?rand=' + Math.random();
            Y.io(url, {
                method: 'GET',
                on: {
                    success: function (txid, resp) {
                        var data;
                        try {
                            data = parseInt(resp.responseText, 10);
                            if (!data) {
                                reject(new Error('MALFORMED RESPONSE'));
                                return;
                            }
                            fulfill(data);
                        } catch (parseErr) {
                            reject(parseErr);
                        }
                    },
                    failure: function (txid, resp) {
                        reject(resp);
                    }
                }
            });
        });
    }


    // returns promise
    function getBuild(recipe, build) {
        return new Y.Promise(function(fulfill, reject) {
            var url = URLS.artifact;
            url = url.replace(/\==RECIPE==/g, recipe);
            url = url.replace(/\==BUILD==/g, build);

            Y.io(url, {
                method: 'GET',
                on: {
                    success: function (txid, resp) {
                        var data;
                        try {
                            data = JSON.parse(resp.responseText);
                            fulfill({build: build, data: data});
                        } catch (parseErr) {
                            reject(parseErr);
                            return;
                        }
                    },
                    failure: function (txid, resp) {
                        // just skip failed builds
                        fulfill();
                    }
                }
            });
        });
    }


    function buildsToGraphs(builds, release) {
        var graphs = {
                agg: [],
                mem: [],
                mem2: [],
                start: [],
                descs: []
            },
            vsizes = {},    // time: desc: vsize
            b,
            versionprev = '',
            version;

        builds.sort(function(a, b) {
            return a.build - b.build;
        });

        builds.forEach(function(build) {
            var buildMemMin = 0,
                buildMemMax = 0,
                buildMemTotal = 0,
                buildMemCount = 0,
                buildMSPRTotal = 0,
                buildMSPRCount = 0,
                buildMemStart;

            if ('object' !== typeof build) {
                return;
            }

            if(release){
                version = build.data.version;
                if(version === versionprev) {
                    return;
                };
                versionprev = version;
            }

            graphs.descs.push(build.data.desc);
            buildMemStart = build.data.appStartMemory;

            b = 0;
            build.data.bursts.forEach(function(burst) {
                var burstMemTotal = 0,
                    burstMemCount = 0;
                burst.memories.forEach(function(mem) {
                    buildMemTotal += mem.vsize;
                    buildMemCount += 1;
                    burstMemTotal += mem.vsize;
                    burstMemCount += 1;
                    if (!buildMemMin || mem.vsize < buildMemMin) {
                        buildMemMin = mem.vsize;
                    }
                    if (!buildMemMax || mem.vsize > buildMemMax) {
                        buildMemMax = mem.vsize;
                    }
                });
                buildMSPRTotal += burst.connection.rate.mspc;
                buildMSPRCount += 1;

                if (!graphs.mem[b]) {
                    graphs.mem[b] = {};
                    graphs.mem[b].burst = 'burst ' + (b + 1);
                }
                graphs.mem[b][build.data.desc] = toKilobytes(Math.floor(burstMemTotal / burstMemCount));
                b += 1;
            });

            build.data.bursts[0].memories.forEach(function (memory) {
                var t = new Date(memory.when - buildMemStart.when);
                t = t.toISOString();
                if (!vsizes[t]) {
                    vsizes[t] = {};
                }
                vsizes[t][build.data.desc] = toKilobytes(memory.vsize);
            });

            graphs.agg.push({
                desc: build.data.desc,
                memMax: toKilobytes(buildMemMax),
                memMin: toKilobytes(buildMemMin),
                memStart: toKilobytes(build.data.appStartMemory.vsize),
                memAvg: toKilobytes(Math.floor(buildMemTotal / buildMemCount)),
                mspr: (Math.floor(100 * buildMSPRTotal / buildMSPRCount) / 100)
            });
            graphs.start.push({
                desc: build.data.desc,
                mem: toKilobytes(build.data.appStartMemory.vsize),
                time: build.data.appStartMS
            });
        });

        Object.keys(vsizes).forEach(function (time) {
            var stats = vsizes[time];
            stats.time = time;
            graphs.mem2.push(stats);
        });
        graphs.mem2.sort(function (a, b) {
            return a.time.localeCompare(b.time);
        });

        return graphs;
    }

    Y.namespace('MojitoGH').Graphs = {


        // returns promise
        getLast: function(recipe, count) {
            return getLatest().then(function(lastBuild) {
                var promises = [],
                    b,
                    build;
                for (b = 0; b < count; b += 1) {
                    build = lastBuild - b;
                    promises.push(getBuild(recipe, build));
                }
                return Y.batch.apply(Y, promises).then(function(builds) {
                    return buildsToGraphs(builds);
                });
            });
        },


        // returns promise
        // ... fufilled with same format as getLast()
        getReleases: function(recipe) {
            return getLatest().then(function(lastBuild) {
                var promises = [],
                    b,
                    build,
                    version;
                for (b = 0; b < lastBuild; b += 1) {
                    build = lastBuild - b;
                    promises.push(getBuild(recipe, build));
                }
                return Y.batch.apply(Y, promises).then(function(builds) {
                    return buildsToGraphs(builds, true);
                });
            });
        },


        draw: function (data, IDs) {
            new Y.Chart({
                type: 'combo',
                dataProvider: data.agg,
                categoryKey: 'desc',
                axes: {
                    time: {
                        type: 'numeric',
                        position: 'left',
                        keys: ['mspr'],
                        alwaysShowZero: false,
                        title: 'page speed (time/request)',
                        labelFormat: {
                            suffix: 'ms',
                            decimalPlaces: 1,
                            thousandsSeparator: ','
                        },
                        styles: {
                            title: {
                                color: '#6688DD'
                            }
                        }
                    },
                    mem: {
                        type: 'numeric',
                        position: 'right',
                        keys: ['memMax', 'memMin', 'memStart', 'memAvg'],
                        alwaysShowZero: false,
                        title: 'memory (vsize)',
                        labelFormat: {
                            suffix: 'kb',
                            thousandsSeparator: ','
                        },
                        styles: {
                            title: {
                                color: '#00AA00',
                                rotation: -90
                            }
                        }
                    }
                },
                showAreaFill: true,
                showLines: true,
                showMarkers: true,
                styles: {
                    axes: {
                        desc: {
                            label: {
                                rotation: -90
                            }
                        }
                    },
                    series: {
                        memMax: {
                            area: {
                                alpha: 1,
                                color: '#BBDDBB'
                            },
                            line: {
                                color: '#008800',
                                weight: 1
                            },
                            marker: {
                                radius: 0
                            }
                        },
                        memMin: {
                            area: {
                                alpha: 1,
                                color: '#FAF9F2'
                            },
                            line: {
                                color: '#008800',
                                weight: 1
                            },
                            marker: {
                                radius: 0
                            }
                        },
                        memStart: {
                            area: {
                                alpha: 0,
                                color: 'none'
                            },
                            line: {
                                color: '#00AA00',
                                weight: 2
                            },
                            marker: {
                                border: { color: '#008800' },
                                fill: { color: '#00AA00' },
                                radius: 4
                            }
                        },
                        memAvg: {
                            area: {
                                alpha: 0,
                                color: 'none'
                            },
                            line: {
                                color: '#00AA00',
                                weight: 2
                            },
                            marker: {
                                border: { color: '#008800' },
                                fill: { color: '#00AA00' }
                            }
                        },
                        mspr: {
                            area: {
                                alpha: 0,
                                color: 'none'
                            },
                            line: {
                                color: '#6688DD',
                                weight: 3
                            },
                            marker: {
                                border: { color: '#4444AA' },
                                fill: { color: '#6688DD' }
                            }
                        }
                    }
                },
                render: '#' + IDs.agg
            });
            new Y.Chart({
                type: 'line',
                dataProvider: data.mem2,
                categoryKey: 'time',
                categoryType: 'time',
                axes: {
                    time: {
                        title: 'time since app start (seconds)',
                        labelFormat: '%s'
                    },
                    mem: {
                        type: 'numeric',
                        position: 'left',
                        alwaysShowZero: false,
                        title: 'memory (vsize)',
                        labelFormat: {
                            suffix: 'kb',
                            thousandsSeparator: ','
                        },
                        keys: data.descs
                    }
                },
                horizontalGridlines: {
                    styles: {
                        line: {
                            color: '#DDDDDD'
                        }
                    }
                },
                styles: {
                    axes: {
                        time: {
                            label: {
                                rotation: -90
                            }
                        }
                    }
                },
                legend: {
                    position: 'right'
                },
                render: '#' + IDs.mem
            });
            new Y.Chart({
                dataProvider: data.start,
                categoryKey: 'desc',
                axes: {
                    time: {
                        type: 'numeric',
                        position: 'left',
                        keys: ['time'],
                        alwaysShowZero: false,
                        title: 'start time (milliseconds)',
                        labelFormat: {
                            thousandsSeparator: ','
                        },
                        styles: {
                            title: {
                                color: '#6688DD'
                            }
                        }
                    },
                    mem: {
                        type: 'numeric',
                        position: 'right',
                        keys: ['mem'],
                        alwaysShowZero: false,
                        title: 'start memory (vsize)',
                        labelFormat: {
                            suffix: 'kb',
                            thousandsSeparator: ','
                        },
                        styles: {
                            title: {
                                color: '#00AA00',
                                rotation: -90
                            }
                        }
                    }
                },
                styles: {
                    axes: {
                        desc: {
                            label: {
                                rotation: -90
                            }
                        }
                    },
                    series: {
                        time: {
                            line: {
                                color: '#6688DD',
                                weight: 3
                            },
                            marker: {
                                border: { color: '#4444AA' },
                                fill: { color: '#6688DD' }
                            }
                        },
                        mem: {
                            line: {
                                color: '#00AA00',
                                weight: 2
                            },
                            marker: {
                                border: { color: '#008800' },
                                fill: { color: '#00AA00' }
                            }
                        }
                    }
                },
                render: '#' + IDs.start
            });
        }


    };



}, '0.0.1', {requires: [
    'io',
    'promise',
    'charts-legend'
]});

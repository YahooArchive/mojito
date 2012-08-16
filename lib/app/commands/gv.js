/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, nomen:true, sloppy:true, stupid:true*/


// TODO:
//  * include YUI internal structure (but not edges/dependencies)
//  * [warning][server] trace anything that leads to a YUI module that uses the DOM
//  * also draw meta.optional edges
//  * color-code or shape-code module types (from yui, mojito fw, app-level,
//    mojits, affinity)

var run,
    libpath = require('path'),
    libfs = require('fs'),
    existsSync = libfs.existsSync || libpath.existsSync,
    libutils = require(libpath.join(__dirname, '../../management/utils')),
    YUI = require('yui').YUI,
    Y = YUI(),

    MODE_ALL = parseInt('777', 8),

    artifactsDir = 'artifacts',
    resultsDir = 'artifacts/gv';



// Quote a graphviz property.
function gvQuote(str) {
    str = str.toString().replace(/"/g, '\\"');
    return '"' + str + '"';
}


// Turn an object into a set of graphviz properties.
function gvStyle(style, nopad) {
    var pairs = [];
    Y.Object.each(style, function(v, k) {
        pairs.push(k + '=' + gvQuote(v));
    });
    if (!pairs.length) {
        return '';
    }
    return (nopad ? '' : ' ') + '[' + pairs.join(',') + ']';
}


function Node(name) {
    this.name = name;
    this.attrs = {};    // arbitrary user-defined attributes
    this.style = {};    // graphviz style attributes
}

function Edge(tail, head, directed) {
    this.tail = tail;
    this.head = head;
    this.directed = directed || false;
    this.attrs = {};    // arbitrary user-defined attributes
    this.style = {};    // graphviz style attributes
}

function Graph(name) {
    this.name = name;
    this.type = 'graph';// top-level:  graph | digraph
                        // subgraph:  group | subgraph | cluster
    this.title = name;  // title can be different than name
                        // (name is used as the identifier)
                        // (for .type===cluster you might want to set .style.label)
    this.attrs = {};    // arbitrary user-defined attributes
    this.style = {};    // graphviz style attributes for the Graph itself
    this.styles = {     // type: default graphviz style attributes
        node: {},           // ... for nodes
        edge: {},           // ... for nodes
        graph: {},          // ... for nodes
        all: {}             // ... for everything
    };
    this._nodes = {};       // id: Node
    this._edges = {};       // id: Edge
    this._subgraphs = {};   // id: Graph
}
Graph.prototype = {

    // finds the node, no matter how deeply nested
    // creates the node if it doesn't already exist
    // @param name {string} name of node
    getNode: function(name) {
        var node;
        this._find('_nodes', name, function(parent, found) {
            node = found;
        });
        if (!node) {
            node = new Node(name);
            this._nodes[name] = node;
        }
        return node;
    },

    // finds the edge, no matter how deeply nested
    // creates the edge if it doesn't already exist
    // @param tail {string} name of tail node
    // @param head {string} name of head node
    getEdge: function(tail, head, directed) {
        var id = this._makeEdgeID(tail, head, directed),
            edge;
        this._find('_edges', id, function(parent, found) {
            edge = found;
        });
        if (!edge) {
            edge = new Edge(tail, head, directed);
            this._edges[id] = edge;
        }
        return edge;
    },

    // finds the subgraph, no matter how deeply nested
    // creates the subgraph if it doesn't already exist
    // @param name {string} name of subgraph
    // @return {Graph} found subgraph
    getSubgraph: function(name) {
        var subgraph;
        this._find('_subgraphs', name, function(parent, found) {
            subgraph = found;
        });
        if (!subgraph) {
            subgraph = new Graph(name);
            this._subgraphs[name] = subgraph;
        }
        return subgraph;
    },

    // moves the node from existing subgraph to the one speciefied
    // @param node {string} name of node to move
    // @param parent {string} name of new parent parent
    moveNodeToSubgraph: function(node, parent) {
        var found;
        this._find('_nodes', node, function(foundParent, foundItem) {
            delete foundParent._nodes[node];
            found = foundItem;
        });
        if (!found) {
            found = new Node(node);
        }
        this.getSubgraph(parent)._nodes[node] = found;
    },

    // arranges for child subgraph to be drawn inside parent subgraph
    // @param child {string} child subgraph name
    // @param parent {string} parent subgraph name
    moveSubgraphToSubgraph: function(child, parent) {
        var found;
        this._find('_subgraphs', child, function(foundParent, foundItem) {
            delete foundParent._subgraphs[child];
            found = foundItem;
        });
        if (!found) {
            found = new Graph(child);
        }
        this.getSubgraph(parent)._subgraphs[child] = found;
    },

    // if a filter returns false, that node/edge/subgraph is skipped
    // @param filters {object} callbacks to det
    // @param filters.node {function(Node)}
    // @param filters.edge {function(Edge)}
    // @param filters.subgraph {function(Graph)}
    // @param _ctx {object} [private] graph drawing context, for recursion
    // @return {string} graphviz DOT notation
    render: function(filters, _ctx) {
        _ctx = _ctx || {depth: 0, count: 0};
        _ctx.count += 1;
        var out = '',
            section,
            i,
            indent = '';

        // I would just do the following, but jslint is overly strict.
        // indent = new Array(_ctx.depth + 1).join('    ');
        for (i = 0; i < _ctx.depth; i += 1) {
            indent += '    ';
        }

        if ('group' === this.type) {
            out += indent + '{\n';
        } else if ('cluster' === this.type) {
            out += indent + 'subgraph ' + gvQuote('cluster_' + _ctx.count) + ' {\n';
        } else {
            out += indent + this.type + ' ' + gvQuote(this.title) + ' {\n';
        }

        section = '';
        if (Object.keys(this.styles.all).length) {
            Y.Object.each(this.styles.all, function(v, k) {
                section += indent + '    ' + k + '=' + gvQuote(v) + ';\n';
            });
        }
        if (Object.keys(this.styles.node).length) {
            section += indent + '    node' + gvStyle(this.styles.node) + ';\n';
        }
        if (Object.keys(this.styles.edge).length) {
            section += indent + '    edge' + gvStyle(this.styles.edge) + ';\n';
        }
        if (Object.keys(this.styles.graph).length) {
            section += indent + '    graph' + gvStyle(this.styles.graph) + ';\n';
        }
        if (section) {
            out += indent + '    // defaults\n';
            out += section;
            out += '\n';
        }

        section = '';
        this._filter(this._nodes, filters.node, function(key, val) {
            section += indent + '    ' + gvQuote(val.name) + gvStyle(val.style) + ';\n';
        });
        if (section) {
            out += indent + '    // nodes\n';
            out += section;
            out += '\n';
        }

        section = '';
        this._filter(this._edges, filters.edge, function(key, val) {
            section += indent + '    ' + gvQuote(val.tail) +
                ' ' + (val.directed ? '->' : '--') + ' ' +
                gvQuote(val.head) + gvStyle(val.style) + ';\n';
        });
        if (section) {
            out += indent + '    // edges\n';
            out += section;
            out += '\n';
        }

        section = '';
        this._filter(this._subgraphs, filters.subgraph, function(key, val) {
            var c = { depth: _ctx.depth + 1, count: _ctx.count };
            section += val.render(filters, c);
            _ctx.count = c.count;
        });
        if (section) {
            out += indent + '    // subgraphs\n';
            out += section;
            out += '\n';
        }

        section = '';
        Y.Object.each(this.style, function(v, k) {
            section += indent + '    ' + k + '=' + gvQuote(v) + ';\n';
        });
        if (section) {
            out += indent + '    // this graph\n';
            out += section;
        }
        out += indent + '};\n';
        return out;
    },

    // generic recursive find algorithm
    _find: function(source, target, cb) {
        var id, subgraph;
        if (source) {
            for (id in this[source]) {
                if (this[source].hasOwnProperty(id) && id === target) {
                    cb(this, this[source][id]);
                    return true;
                }
            }
        }
        for (id in this._subgraphs) {
            if (this._subgraphs.hasOwnProperty(id)) {
                subgraph = this._subgraphs[id];
                if (subgraph._find(source, target, cb)) {
                    return true;
                }
            }
        }
        return false;
    },

    // generic filter algorithm
    _filter: function(obj, filter, cb) {
        Y.Object.each(obj, function(val, key) {
            if (filter && !filter(val)) {
                return;
            }
            cb(key, val);
        });
    },

    // edges are a triple, yet we need a string key for hashes
    _makeEdgeID: function(tail, head, directed) {
        return [tail, directed, head].join(',');
    }

};


// turn a list of resources into graph parts
function parseResources(graph, ress, options) {
    var r,
        res,
        subgraph,
        subgraphName,
        tail,
        tailName,
        head,
        headName,
        edge,
        rs,
        reqs;

    for (r = 0; r < ress.length; r += 1) {
        res = ress[r];

        if (!res.yui || !res.yui.name) {
            continue;
        }
        if ('yui-lang' === res.type && !options.lang) {
            continue;
        }
        if ('binder' === res.type && !options.client) {
            continue;
        }

        // The idea here is that we -do- want to collect information about
        // every module, so that we know which subgraph to draw it in.
        // Later (during the render filters) we'll drop those that aren't
        // of particular interest.

        tailName = res.yui.name;

        subgraphName = 'package ' + res.source.pkg.name + '@' + res.source.pkg.version;
        if (res.mojit && 'shared' !== res.mojit) {
            subgraphName = 'mojit ' + res.mojit;
        }

        // create subgraph and node for -everything- (we'll filter later)
        subgraph = graph.getSubgraph(subgraphName);
        subgraph.type = 'cluster';
        subgraph.style.label = subgraphName;

        tail = graph.getNode(tailName);
        graph.moveNodeToSubgraph(tailName, subgraphName);
        // TODO:  This might be handy to style different types differently.
        //['type', 'subtype', 'affinity'].forEach(function(k) {
        //    tail.attrs[k] = res[k];
        //});
        tail.attrs.pkg = res.source.pkg;

        if ('mojito' === res.source.pkg.name && !options.framework) {
            subgraph.attrs.sparse = true;
            continue;
        }

        reqs = res.yui.meta.requires || [];
        for (rs = 0; rs < reqs.length; rs += 1) {
            headName = reqs[rs];
            edge = graph.getEdge(tailName, headName, true);
            tail.attrs.hasEdge = true;
            head = graph.getNode(headName);
            head.attrs.hasEdge = true;
        }
    }
}


// modify the graph to highlight traced node and nodes depending on it
function trace(graph, options) {
    var doneNodes = {}, // name: true
        todoNodes = [],
        headName,
        head,
        e,
        edge,
        edges = {}; // headName: [ Edge ]

    // TODO:  detect if options.trace doesn't exist in graph
    todoNodes.push(options.trace);

    Y.Object.each(graph._edges, function(edge) {
        if (!edges[edge.head]) {
            edges[edge.head] = [];
        }
        edges[edge.head].push(edge);
    });

    while (todoNodes.length) {
        headName = todoNodes.shift();
        if (doneNodes[headName]) {
            continue;
        }
        head = graph.getNode(headName);
        head.attrs.trace = true;
        doneNodes[headName] = true;

        if (edges[headName]) {
            for (e = 0; e < edges[headName].length; e += 1) {
                edge = edges[headName][e];
                edge.attrs.trace = true;
                todoNodes.push(edge.tail);
            }
        }
    }
}


run = function(params, options) {
    var env,
        store,
        title,
        graph,
        ress,
        m,
        mojit,
        mojits,
        appConfigRes,
        contents,
        file;

    options = options || {};
    env = options.client ? 'client' : 'server';

    if (params.length) {
        libutils.error('Unknown extra parameters.');
        return;
    }

    // make results dir
    if (!existsSync(artifactsDir)) {
        libfs.mkdirSync(artifactsDir, MODE_ALL);
    }
    if (!existsSync(resultsDir)) {
        libfs.mkdirSync(resultsDir, MODE_ALL);
    }

    Y.applyConfig({
        useSync: true,
        modules: {
            'mojito-resource-store': {
                fullpath: libpath.join(__dirname, '../../store.server.js')
            }
        }
    });
    Y.use('mojito-resource-store');

    // load details
    store = new Y.mojito.ResourceStore({
        root: process.cwd(),
        context: {}
    });
    store.preload();

    appConfigRes = store.getResources('server', {}, {id: 'config--application'})[0];
    title = appConfigRes.source.pkg.name + '@' + appConfigRes.source.pkg.version + ' ' + env;
    graph = new Graph(title);
    graph.type = 'digraph';

    graph.styles.all.rankdir = 'LR';
    graph.styles.all.fontsize = '11';
    graph.styles.node.fontsize = '11';
    graph.styles.node.shape = 'rectangle';
    graph.styles.node.style = 'filled,rounded';
    graph.styles.node.fillcolor = 'white';
    graph.styles.edge.color = 'grey33';
    graph.styles.edge.arrowsize = '0.5';
    graph.styles.edge.fontsize = '8';
    graph.styles.graph.style = 'filled';
    graph.styles.graph.color = 'lightgrey';

    graph.style.clusterrank = 'local';  // DOT -- special handling for clusters
    graph.style.compound = 'true';      // allow edges between clusters (also requires edge[lhead,ltail])
//  graph.style.concentrate = 'true';   // SOMETIMES CRASHES -- reduce number of edges
    graph.style.model = 'circuit';      // NEATO --
    graph.style.overlap = 'false';      // DOT --
//  graph.style.pack = 'true';
//  graph.style.packmode = 'clust';
//  graph.style.rankdir = 'LR';         // DOT -- direction of graph
    graph.style.ranksep = '1.5';        // TWOPI,DOT -- space between ranks
    graph.style.remincross = 'true';    // DOT -- if clusters, rerun cross minimization
    graph.style.splines = 'polyline';   // how to draw edges
    graph.style.start = 'self';         // FDP,NEATO --

    ress = store.getResources(env, {}, {});
    parseResources(graph, ress, options);

    mojits = store.listAllMojits();
    mojits.push('shared');
    for (m = 0; m < mojits.length; m += 1) {
        mojit = mojits[m];
        ress = store.getResources(env, {}, { mojit: mojit });
        parseResources(graph, ress, options);
    }

    if (options.trace) {
        trace(graph, options);
    }

    // generate graph
    contents = graph.render({
        node: function(node) {
            // TODO:  tweak each node style somehow
            //node.style.label = node.name;
            //if (node.attrs.affinity) {
            //    node.style.label += ' (' + node.attrs.affinity.affinity + ')';
            //}
            if (node.attrs.trace) {
                node.style.penwidth = 1.5;
                node.style.color = '#CC0000';
                node.style.fontcolor = '#AA0000';
                node.style.fillcolor = '#FFDDDD';
                if (node.name === options.trace) {
                    node.style.peripheries = 2;
                }
            }
            return true;
        },

        edge: function(edge) {
            if (edge.attrs.trace) {
                edge.style.penwidth = 1.1;
                edge.style.color = '#AA4444';
            }
            return true;
        },

        subgraph: function(subgraph) {
            if (subgraph.attrs.sparse) {
                var doomed = [];
                Y.Object.each(subgraph._nodes, function(node) {
                    // always draw nodes found in the application
                    if ('mojito' === node.attrs.pkg.name && !node.attrs.hasEdge) {
                        doomed.push(node.name);
                    }
                });
                Y.Array.each(doomed, function(name) {
                    delete subgraph._nodes[name];
                });
                if (!Object.keys(subgraph._nodes).length) {
                    return false;
                }
            }
            return true;
        }
    });
    file = libpath.join(resultsDir, 'yui.' + env + '.dot');
    libfs.writeFileSync(file, contents, 'utf-8');

    console.log('Dotfile generated.' +
        ' To turn it into a graph, run the following:');
    console.log('$ dot -Tgif ' + file + ' > ' +
        libpath.join(resultsDir, 'yui.' + env + '.gif'));
};


/**
 * Standard usage string export.
 */
exports.usage = 'mojito gv   // generates a GraphViz[1] file' +
    ' describing the dependencies\n' +
    '            // between the YUI modules\n' +
    '\n' +
    'OPTIONS:\n' +
    '\t --client:  use modules for the client\n' +
    '\t       -c:  short for --client\n' +
    '\t --framework:  include framework (Mojito) modules\n' +
    '\t          -f:  short for --framework\n' +
    '\t --lang:  also show language bundles\n' +
    '\t     -l:  short for --lang\n' +
    '\t --trace target:  hightlight all modules leading to the target\n' +
    '\t      -t target:  short for --trace\n' +
    '\n' +
    '[1] http://en.wikipedia.org/wiki/Graphviz\n';


/**
 * Standard options list export.
 */
exports.options = [
    {
        longName: 'framework',
        shortName: 'f',
        hasValue: false
    },
    {
        longName: 'client',
        shortName: 'c',
        hasValue: false
    },
    {
        longName: 'lang',
        shortName: 'l',
        hasValue: false
    },
    {
        longName: 'trace',
        shortName: 't',
        hasValue: true
    }
];


/**
 * Standard run method hook export.
 */
exports.run = run;



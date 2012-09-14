/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, nomen:true, sloppy:true, stupid:true*/


// TODO:
//  * draw each request separately somehow


var run,
    libpath = require('path'),
    libfs = require('fs'),
    existsSync = libfs.existsSync || libpath.existsSync,
    libutils = require(libpath.join(__dirname, '../../management/utils')),

    MODE_ALL = parseInt('777', 8),

    artifactsDir = 'artifacts',
    resultsDir = 'artifacts/profiler',

    LOG_SEPARATOR = '|',
    SVG_WIDTH = 800,
    SVG_ENTRY_HEIGHT = 20,
    SVG_ENTRY_OFFSET = 2,
    SVG_FONT_SIZE = 8,

    XML_CHARS = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;'
    };


function addCommas(str) {
    var rx = /(\d+)(\d{3})/;
    str += '';
    while (rx.test(str)) {
        str = str.replace(rx, '$1,$2');
    }
    return str;
}


function xmlEncode(str) {
    return str.replace(/[&<>"']/g, function(c) { return XML_CHARS[c]; });
}


function logProcess(lines) {
    var l,
        line,
        parts,
        log = {},
        entry;
    for (l = 0; l < lines.length; l += 1) {
        line = lines[l];
        if (!line) {
            continue;
        }
        entry = null;
        parts = line.split(LOG_SEPARATOR);
        if ('MARK' === parts[0]) {
            entry = {
                logOrder: l,
                type: parts.shift(),
                request: parts.shift(),
                start: parts.shift(),
                duration: parts.shift(),
                group: parts.shift(),
                label: parts.shift(),
                id: parts.shift()
            };
            entry.desc = parts.join(LOG_SEPARATOR);
            entry.start = parseInt(entry.start, 10);
        } else if ('TIMELINE' === parts[0]) {
            entry = {
                logOrder: l,
                type: parts.shift(),
                request: parts.shift(),
                start: parts.shift(),
                duration: parts.shift(),
                group: parts.shift(),
                label: parts.shift(),
                id: parts.shift()
            };
            entry.desc = parts.join(LOG_SEPARATOR);
            entry.start = parseInt(entry.start, 10);
            entry.duration = parseInt(entry.duration, 10);
            entry.end = entry.start + entry.duration;
        }
        if (entry) {
            if (!log[entry.start]) {
                log[entry.start] = [];
            }
            log[entry.start].push(entry);
        }
    }
    return log;
}


function svgDraw(file, log) {
    var min = Number.POSITIVE_INFINITY,
        max = 0,
        e,
        entry,
        entries = 0,
        times = Object.keys(log),
        t,
        time,
        pixelsPerSecond,
        svg,
        ee = 0,
        x0,
        x1,
        y0,
        y1,
        ytext,
        text,
        tooltip,
        laststart;

    times.sort();

    for (t = 0; t < times.length; t += 1) {
        time = times[t];
        for (e = 0; e < log[time].length; e += 1) {
            entry = log[time][e];
            min = Math.min(min, entry.start);
            max = Math.max(max, entry.start);
            if (entry.end) {
                min = Math.min(min, entry.end);
                max = Math.max(max, entry.end);
            }
            entries += 1;
        }
    }
    pixelsPerSecond = SVG_WIDTH / (max - min);

    svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="' + SVG_WIDTH + 'px" height="' + (entries * SVG_ENTRY_HEIGHT) + 'px">\n';
    svg += '    <title>mojito profile</title>\n';

    svg += '    <style type="text/css" >\n';
    svg += '        text { font-size: ' + SVG_FONT_SIZE + 'pt; }\n';
    svg += '        text.left { text-anchor: start; }\n';
    svg += '        text.right { text-anchor: end; }\n';
    svg += '        .MARK     { fill: #FF8888; stroke: none; }\n';
    svg += '        .TIMELINE { fill: #8888FF; stroke: none; }\n';
    svg += '    </style>\n';

    laststart = min;
    for (t = 0; t < times.length; t += 1) {
        time = times[t];
        for (e = 0; e < log[time].length; e += 1) {
            entry = log[time][e];
            y0 = SVG_ENTRY_OFFSET + (ee * SVG_ENTRY_HEIGHT);
            y1 = ((ee + 1) * SVG_ENTRY_HEIGHT) - SVG_ENTRY_OFFSET;
            x0 = Math.round((entry.start - min) * pixelsPerSecond);

            text = [entry.group, entry.label].join(':');
            if (entry.id) {
                text += '[' + entry.id + ']';
            }

            tooltip = [];
            tooltip.push(entry.start - min);
            tooltip.push('+' + addCommas(entry.start - laststart));

            svg += '    <g>\n';

            if (entry.end) {
                x1 = Math.round((entry.end - min) * pixelsPerSecond);
                if (x0 === x1) {
                    x0 -= 0.5;
                    x1 += 0.5;
                }
                svg += '        <rect class="' + entry.type + '" x="' + x0 + '" width="' + (x1 - x0) + '" y="' + y0 + '" height="' + (y1 - y0) + '" />\n';
            } else {
                svg += '        <circle class="' + entry.type + '" cx="' + x0 + '" cy="' + Math.round((y1 + y0) / 2) + '" r="4" />\n';
            }

            tooltip.push('');
            tooltip.push(entry.desc);
            if (entry.end) {
                tooltip.push('');
                tooltip.push('+' + addCommas(entry.end - entry.start));
            }

            ytext = y1 - (SVG_FONT_SIZE / 2);
            if (x0 > (SVG_WIDTH / 2)) {
                svg += '        <text class="right" x="' + (x0 - 4) + '" y="' + ytext + '">\n';
                svg += '            <tspan>' + xmlEncode(text) + '</tspan>\n';
                svg += '            <title>' + xmlEncode(tooltip.join(' ')) + '</title>\n';
                svg += '        </text>\n';
            } else {
                svg += '        <text class="left" x="' + (x0 + 4) + '" y="' + ytext + '">\n';
                svg += '            <tspan>' + xmlEncode(text) + '</tspan>\n';
                svg += '            <title>' + xmlEncode(tooltip.join(' ')) + '</title>\n';
                svg += '        </text>\n';
            }

            svg += '    </g>\n';

            laststart = entry.start;
            ee += 1;
        }
    }

    svg += '</svg>\n';
    libfs.writeFileSync(file, svg, 'utf-8');
}


run = function(params, options) {
    var env,
        store,
        inFile,
        outFile,
        lines,
        log;

    options = options || {};

    // default input if --input filename.ext is not set
    inFile = options.input || 'perf.log';

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

    outFile = inFile.replace(/\.log$/, '.svg');
    outFile = libpath.join(resultsDir, outFile);

    lines = libfs.readFileSync(inFile, 'utf-8').split('\n');
    log = logProcess(lines);
    svgDraw(outFile, log);

    console.log('graph drawn in ' + outFile);
};


/**
 * Standard usage string export.
 */
exports.usage = 'mojito profiler   // generates an SVG image of the profiling log\n' +
    '\t--input     Path and filename of the input file (default value perf.log).\n';


/**
 * Standard options list export.
 */
exports.options = [
    {
        longName: 'input',
        shortName: null,
        hasValue: true
    }
];


/**
 * Standard run method hook export.
 */
exports.run = run;



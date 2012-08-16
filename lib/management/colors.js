/*
colors.js

Copyright (c) 2010 Alexis Sellier (cloudhead) , Marak Squires

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/


/*jslint anon:true, sloppy:true*/


function stylize(str, style) {
    var styles = {
        //styles
        'bold' : [1, 22],
        'italic' : [3, 23],
        'underline' : [4, 24],
        'inverse' : [7, 27],
        //grayscale
        'white' : [37, 39],
        'grey' : [90, 39],
        'black' : [90, 39],
        //colors
        'blue' : [34, 39],
        'cyan' : [36, 39],
        'green' : [32, 39],
        'magenta' : [35, 39],
        'red' : [31, 39],
        'yellow' : [33, 39]
    };
    return '\u001b[' + styles[style][0] + 'm' + str +
        '\u001b[' + styles[style][1] + 'm';
}

// prototypes the string object to have additional method calls that add
// terminal colors
(['bold', 'underline', 'italic', 'inverse', 'grey', 'yellow', 'red', 'green',
    'blue', 'white', 'cyan', 'magenta']).forEach(
    function(style) {
        try {
            Object.defineProperty(String.prototype, style, {
                get: function() {
                    return stylize(this, style);
                }
            });
        } catch (e) {
            // just ignore
        }
    }
);

// prototypes string with method "rainbow"
// rainbow will apply a the color spectrum to a string, changing colors every
// letter
try {
    Object.defineProperty(String.prototype, 'rainbow', {
        get: function() {
            //RoY G BiV
            var rainbowcolors = ['red', 'yellow', 'green', 'blue', 'magenta'],
                exploded = this.split(''),
                i = 0;

            exploded = exploded.map(function(letter) {
                if (letter === ' ') {
                    return letter;
                } else {
                    return stylize(letter, rainbowcolors[(i += 1) %
                        rainbowcolors.length]);
                }
            });
            return exploded.join('');
        }
    });
} catch (e) {
    // just ignore
}



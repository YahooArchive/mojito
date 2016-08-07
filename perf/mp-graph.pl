#!/usr/bin/env perl
#
# Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
# Copyrights licensed under the New BSD License.
# See the accompanying LICENSE file for terms.
#


use strict;
use warnings;
use Data::Dumper;


our $GRAPH_WIDTH    = 800;
our $GRAPH_HEIGHT   = 600;


sub htmlentityencode {
    my $v = shift;
    $v =~ s/&/&amp;/g;
    $v =~ s/'/&apos;/g;
    $v =~ s/"/&quot;/g;
    $v =~ s/</&lt;/g;
    $v =~ s/>/&gt;/g;
    return $v;
}


sub round {
    return sprintf('%0.1f', shift);
}


sub file_read {
    my $path = shift || die;
    open(F, "<$path") or die("FAILED to open $path");
    my @lines = <F>;
    close(F) or die("FAILED to close $path");

    my $header = shift @lines;
    chomp $header;
    my @colnames = split ',', $header;

    my @rows;
    foreach my $line ( @lines ) {
        chomp $line;
        my @cols = split ',', $line;
        my %cols;

        # WARNING: perl voodoo
        # search for "hash slice" in `perldoc perldata` for details
        @cols{@colnames} = @cols;

        push @rows, \%cols;
    }
    return \@rows;
}


sub graph_render {
    my $graph = shift or die;   # hashref

    my @svg = '<?xml version="1.0" encoding="utf-8" ?>';
    push @svg, '<svg version="1.1" baseProfile="full" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">';

    push @svg, <<ENDDEFS;
    <defs>
        <style type="text/css"><![CDATA[
            svg * {
                font-family: arial;
                font-size: 12;
            }
            .title tspan {
                font-size: 16;
                font-weight: bold;
            }
            .axis .line {
                stroke: #AAAAAA;
                stroke-width: 1;
                stroke-linecap: square;
            }
            .axis .tick {
                stroke: #AAAAAA;
                stroke-width: 1;
            }
            .axis .label {
                fill: #AAAAAA;
                font-size: 12;
            }
            .line circle {
                fill: none;
                stroke: #000000;
                stroke-width: 1;
            }
            .line polyline {
                fill: none;
                stroke: #000000;
                stroke-width: 2;
            }
        ]]></style>
    </defs>
ENDDEFS

    push @svg, '    <rect width="'.($GRAPH_WIDTH+100).'" height="'.($GRAPH_HEIGHT+80).'" fill="#FFFFFF" />';

    # title
    push @svg, '    <g class="title">';
    push @svg, '        <text x="'.(50+round($GRAPH_WIDTH/2)).'" y="28" text-anchor="middle">';
    push @svg, '            <tspan>' . $graph->{'title'} . '</tspan>';
    push @svg, '        </text>';
    push @svg, '    </g>';

    # scaling
    my %min;    # axis => min
    my %max;    # axis => max
    my $lines = $graph->{'lines'} || [];
    foreach my $line ( @$lines ) {
        my $points = $line->{'points'} || [];
        foreach my $point ( @$points ) {
            my($x, $y) = @$point;
            my $xaxis = $line->{'xaxis'} || 'bottom';
            my $yaxis = $line->{'yaxis'} || 'left';
            $min{$xaxis} ||= 999999999999999;
            $min{$xaxis} = $x if $x < $min{$xaxis};
            $min{$yaxis} ||= 999999999999999;
            $min{$yaxis} = $y if $y < $min{$yaxis};
            $max{$xaxis} ||= 0;
            $max{$xaxis} = $x if $x > $max{$xaxis};
            $max{$yaxis} ||= 0;
            $max{$yaxis} = $y if $y > $max{$yaxis};
        }
    }
    my %size;   # axis => pixels;
    $size{'top'} = $size{'bottom'} = $GRAPH_WIDTH;
    $size{'left'} = $size{'right'} = $GRAPH_HEIGHT;
    my %scale;  # axis => pixels/unit
    foreach my $axis ( keys %min ) {
        if ( $max{$axis} == $min{$axis} ) {
            $min{$axis}--;
            $max{$axis}++;
        }
        $scale{$axis} = $size{$axis} / ($max{$axis} - $min{$axis});
    }
    foreach my $axis ( keys %min ) {
        # add 10pixel boarder
        $min{$axis} -= 10 / $scale{$axis};
        $max{$axis} += 10 / $scale{$axis};
        $scale{$axis} = $size{$axis} / ($max{$axis} - $min{$axis});
    }

    # lines
    foreach my $line ( @$lines ) {
        push @svg, '    <g class="line">';
        my $points = $line->{'points'} || [];
        my @gpoints;
        foreach my $point ( @$points ) {
            my($x, $y) = @$point;
            my $xaxis = $line->{'xaxis'} || 'bottom';
            my $yaxis = $line->{'yaxis'} || 'left';
            my $gx = round(50 + ($x - $min{$xaxis}) * $scale{$xaxis});
            my $gy = round(30 + ($max{$yaxis} - $y) * $scale{$yaxis});
            push @svg, '        <circle cx="'.$gx.'" cy="'.$gy.'" r="4" />';
            push @gpoints, "$gx,$gy";
        }
        push @svg, '        <polyline points="'.join(' ', @gpoints).'" />' if @gpoints > 1;
        push @svg, '    </g>';
    }

    # statograms
    # TODO

    # y-left axis
    if ( defined $min{'left'} ) {
        my $x = $GRAPH_WIDTH + 50;
        my $y = $GRAPH_HEIGHT + 30;
        push @svg, '    <g class="axis left">';
        push @svg, '        <line class="line" x1="50" y1="30" x2="50" y2="'.$y.'" />';
        for (my $i = 0; $i <= 10; $i++) {
            my $y = round(30 + (10-$i) * ($GRAPH_HEIGHT / 10));
            push @svg, '        <line class="tick" x1="40" y1="'.$y.'" x2="50" y2="'.$y.'" />';
        }
        my $tickscale = ($max{'left'} - $min{'left'}) / 10;
        for (my $i = 0; $i <= 10; $i++) {
            my $y = round(35 + (10-$i) * ($GRAPH_HEIGHT / 10));
            my $v = round($min{'left'} + ($i * $tickscale));
            push @svg, '        <text class="label" x="40" y="'.$y.'" font-size="12" text-anchor="end" >'.$v.'</text>';
        }
        push @svg, '    </g>';
    }

    # y-right axis
    if ( defined $min{'right'} ) {
        my $x = $GRAPH_WIDTH + 50;
        my $y = $GRAPH_HEIGHT + 30;
        push @svg, '    <g class="axis right">';
        push @svg, '        <line class="line" x1="'.$x.'" y1="30" x2="'.$x.'" y2="'.$y.'" />';
        for (my $i = 0; $i <= 10; $i++) {
            my $y = round(30 + (10-$i) * ($GRAPH_HEIGHT / 10));
            push @svg, '        <line class="tick" x1="'.$x.'" y1="'.$y.'" x2="'.($x+10).'" y2="'.$y.'" />';
        }
        my $tickscale = ($max{'right'} - $min{'right'}) / 10;
        for (my $i = 0; $i <= 10; $i++) {
            my $y = round(35 + (10-$i) * ($GRAPH_HEIGHT / 10));
            my $v = round($min{'right'} + ($i * $tickscale));
            push @svg, '        <text class="label" x="'.($x+10).'" y="'.$y.'" font-size="12" text-anchor="begin" >'.$v.'</text>';
        }
        push @svg, '    </g>';
    }

    # x-bottom axis
    if ( defined $min{'bottom'} ) {
        my $x = $GRAPH_WIDTH + 50;
        my $y = $GRAPH_HEIGHT + 30;
        push @svg, '    <g class="axis bottom">';
        push @svg, '        <line class="line" x1="50" y1="'.$y.'" x2="'.$x.'" y2="'.$y.'" />';
        for (my $i = 0; $i <= 10; $i++) {
            my $x = round(50 + $i * ($GRAPH_WIDTH / 10));
            push @svg, '        <line class="tick" x1="'.$x.'" y1="'.$y.'" x2="'.$x.'" y2="'.($y+10).'" />';
        }
        my $tickscale = ($max{'bottom'} - $min{'bottom'}) / 10;
        for (my $i = 0; $i <= 10; $i++) {
            my $x = round(50 + $i * ($GRAPH_WIDTH / 10));
            my $v = round($min{'bottom'} + ($i * $tickscale));
            push @svg, '        <text class="label" x="'.$x.'" y="'.($y+22).'" font-size="12" text-anchor="middle" >'.$v.'</text>';
        }
        push @svg, '    </g>';
    }

    # legend
    # TODO

    push @svg, '</svg>';

    print join("\n", @svg), "\n";
}


sub draw_basics {
    my @files = @_ or usage("missing file(s)");
    my @lines;
    foreach my $file ( @files ) {
        my $runs = file_read($file);
        my @RPSpoints;
        my @MPRpoints;
        my $name;
        foreach my $run ( @$runs ) {
            $name = $run->{'recipe'};
            push @RPSpoints, [$run->{'run-number'}, $run->{'requests-per-second'}];
            push @MPRpoints, [$run->{'run-number'}, $run->{'microseconds-per-request'}];
        }
        $name ||= '???';
        push @lines, {
            'name' => "$name req/s",
            'yaxis' => 'left',
            'points' => \@RPSpoints
        };
        push @lines, {
            'name' => "$name µs/req",
            'yaxis' => 'right',
            'points' => \@MPRpoints
        };
    }
    my %graph;
    $graph{'title'} = 'basics';
    $graph{'lines'} = \@lines;
    graph_render(\%graph);
}


sub draw_conntotal {
    my @files = @_;
    # TODO
    print "not yet implemented\n";
}


sub draw_pctserved {
    my @files = @_;
    # TODO
    print "not yet implemented\n";
}


sub usage {
    my $error = shift;
    print "ERROR:  $error\n" if $error;
    print "USAGE: mp-graph.pl {type} ...\n" unless $error;
    print "\n";
    print "mp-graph.pl basics {files}\n";
    print "    draws requests-per-second and microseconds-per-request\n";
    print "    draws one line per file\n";
    print "\n";
    print "mp-graph.pl conntotal {file}\n";
    print "    draws stats for each run\n";
    print "    draws one color for each file\n";
    print "\n";
    print "mp-graph.pl pctserved {file}\n";
    print "    draws times required to serve a percentage of the traffic\n";
    print "\n";
    exit 1 if $error;
    exit 0;
}


sub main {
    my $type = shift @ARGV or usage();
    draw_basics(@ARGV) if $type eq 'basics';
    draw_conntotal(@ARGV) if $type eq 'conntotal';
    draw_pctserved(@ARGV) if $type eq 'pctserved';
}
main();



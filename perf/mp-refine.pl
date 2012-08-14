#!/usr/bin/env perl
#
# Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
# Copyrights licensed under the New BSD License.
# See the accompanying LICENSE file for terms.
#


use strict;
use warnings;
use JSON::XS;
use Data::Dumper;


our @FIELDS = qw/ 
        recipe
        run-number
        run-label
        requests-per-second
        microseconds-per-request
        conntotal-min
        conntotal-mean
        conntotal-stddev
        conntotal-median
        conntotal-max
        served-50pct
        served-66pct
        served-75pct
        served-80pct
        served-90pct
        served-95pct
        served-98pct
        served-99pct
        served-100pct
/;


sub raw_refine {
    my $file = shift or die;
    my %stats;

    open(F, "<$file") or die("FAILED to open $file");
    my $body = join '', <F>;
    close(F) or die("FAILED to close $file");

    my @sections = split "\n\n", $body;

    my $recipe = shift @sections;
    $recipe = decode_json($recipe) || {};
    $stats{'recipe'} = $recipe->{'recipe'};
    $stats{'run-number'} = $recipe->{'run'}{'number'};
    $stats{'run-label'} = $recipe->{'run'}{'label'};

    foreach my $section ( @sections ) {

        if ( $section =~ m/Requests per second:\s+([\d.]+) \[#\/sec\] \(mean\)/ ) {
            $stats{'requests-per-second'} = $1;
        }
        if ( $section =~ /Time per request:\s+([\d.]+) \[ms\] \(mean\)/ ) {
            $stats{'microseconds-per-request'} = $1;
        }

        if ('Connection Times' eq substr($section, 0, 16)
                and
            $section =~ /^Total:\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/m)
        {
            $stats{'conntotal-min'} = $1;
            $stats{'conntotal-mean'} = $2;
            $stats{'conntotal-stddev'} = $3;
            $stats{'conntotal-median'} = $4;
            $stats{'conntotal-max'} = $5;
            next;
        }

        if ('Percentage of the requests served within' eq substr($section, 0, 40)) {
            while ( $section =~ m/^\s+(\d+)\%\s+([\d.]+)/mg ) {
                $stats{"served-${1}pct"} = $2;
            }
            next;
        }

    }

    return \%stats;
}


sub main {
    print join(',', @FIELDS), "\n";
    foreach my $file ( @ARGV ) {
        my $stats = raw_refine($file);
        print join(',', map { $stats->{$_} || '' } @FIELDS), "\n";
    }
}
main();



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



sub cmd {
    my $cmd = shift or die;
    print "--cmd-- $cmd\n";
    0 == system($cmd) or die("FAILED to run \"$cmd\"");
}


sub recipe_read {
    my $file = shift or die;
    open(F, "<$file") or die("FAILED to open $file");
    my $body = join '', <F>;
    close(F) or die("FAILED to close $file");
    return decode_json($body);
}


sub run_number {
    my $outDir = shift or die;
    my $i;
    for ($i = 1; $i < 9999; $i++) {
        my $file = sprintf('run%04d.raw', $i);
        return "$outDir/$file" unless -e "$outDir/$file";
    }
    return $i;
}


sub run_go {
    my $recipe = shift or die;
    my $outFile = shift or die;
#rint Dumper($recipe);

    open(F, ">$outFile") or die("FAILED to open $outFile");
    print F encode_json($recipe), "\n\n";
    close(F) or die("FAILED to close $outFile");

    if ( $recipe->{'harness'}{'warmupRequests'} ) {
        my $cmd = sprintf('ab -n%s -c%s "%s" >/dev/null',
            $recipe->{'harness'}{'warmupRequests'},
            $recipe->{'harness'}{'concurrency'},
            $recipe->{'url'},
        );
        cmd($cmd);
    }

    my $cmd = sprintf('ab -n%s -c%s "%s" >>%s',
        $recipe->{'harness'}{'requests'},
        $recipe->{'harness'}{'concurrency'},
        $recipe->{'url'},
        $outFile
    );
    cmd($cmd);
}


sub usage {
    print "USAGE:  mp-run.pl {recipe.json}\n";
    exit 1;
}


sub main {
    my $recipeFile = shift @ARGV or usage();
    my $runLabel = shift @ARGV;
    usage() unless -f $recipeFile;

    my $outDir = $recipeFile;
    $outDir =~ s/\.json$//;
    cmd("mkdir $outDir") unless -d $outDir;

    my $recipe = recipe_read($recipeFile);
    $recipe->{'recipe'} = $outDir;

    my $runNumber;
    my $runFile;
    for ($runNumber = 1; $runNumber < 9999; $runNumber++) {
        $runFile = $outDir . '/' . sprintf('run%04d.raw', $runNumber);
        last unless -e $runFile;
    }
    $recipe->{'run'}{'number'} = $runNumber;
    $recipe->{'run'}{'label'} = $runLabel if $runLabel;

    run_go($recipe, $runFile);
}
main();



/*
 * YUI Test
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */
package com.yahoo.platform.yuitest.coverage.report;

import com.yahoo.platform.yuitest.coverage.results.SummaryCoverageReport;
import jargs.gnu.CmdLineParser;
import java.io.*;

/**
 * Main YUI Test Coverage class.
 * @author Nicholas C. Zakas
 */
public class YUITestCoverageReport {

    public static void main(String args[]) {

        //----------------------------------------------------------------------
        // Initialize command line parser
        //----------------------------------------------------------------------
        CmdLineParser parser = new CmdLineParser();
        CmdLineParser.Option verboseOpt = parser.addBooleanOption('v', "verbose");
        CmdLineParser.Option helpOpt = parser.addBooleanOption('h', "help");
        CmdLineParser.Option formatOpt = parser.addStringOption("format");
        CmdLineParser.Option outputLocationOpt = parser.addStringOption('o', "output");

        Reader in = null;
        Writer out = null;

        try {

            parser.parse(args);

            //Help option
            Boolean help = (Boolean) parser.getOptionValue(helpOpt);
            if (help != null && help.booleanValue()) {
                usage();
                System.exit(0);
            }

            //Verbose option
            boolean verbose = parser.getOptionValue(verboseOpt) != null;

            //format option
            String format = (String) parser.getOptionValue(formatOpt);
            if (format == null) {
                format = "HTML";
            }

            if (verbose) {
                System.err.println("\n[INFO] Using format '" + format + "'.");
            }

            //report option
            String outputLocation = (String) parser.getOptionValue(outputLocationOpt);
            if (outputLocation == null){
                outputLocation = ".";               
            }

            if (verbose) {
                System.err.println("\n[INFO] Using output directory '" + outputLocation + "'.");
            }

            //get the files to operate on
            String[] fileArgs = parser.getRemainingArgs();

            if (fileArgs.length == 0) {
                usage();
                System.exit(1);
            }            

            if (verbose) {
                System.err.println("\n[INFO] Preparing to generate coverage reports.");
            }

            in = new InputStreamReader(new FileInputStream(fileArgs[0]));
            SummaryCoverageReport fullReport = new SummaryCoverageReport(in);
            in.close();

            for (int i=1; i < fileArgs.length; i++){
                in = new InputStreamReader(new FileInputStream(fileArgs[i]));
                fullReport.merge(new SummaryCoverageReport(in));
                in.close();
            }

            CoverageReportGenerator generator = CoverageReportGeneratorFactory.getGenerator(format, outputLocation, verbose);
            generator.generate(fullReport);
            
        } catch (CmdLineParser.OptionException e) {

            usage();
            System.exit(1);

        } catch (IOException e) {

            e.printStackTrace();
            System.exit(1);

        } catch (Exception e) {

            e.printStackTrace();
            // Return a special error code used specifically by the web front-end.
            System.exit(2);
        
        } finally {

            if (in != null) {
                try {
                    in.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }

            if (out != null) {
                try {
                    out.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    private static void usage() {
        System.out.println(
                "\nUsage: java -jar yuitest-coverage-report-x.y.z.jar [options] [file]\n\n"

                        + "Global Options\n"
                        + "  -h, --help              Displays this information.\n"
                        + "  --format <format>       Output reports in <format>. Defaults to HTML.\n"
                        + "  -v, --verbose           Display informational messages and warnings.\n"
                        + "  -o <file|dir>           Place the output into <file|dir>.\n\n");
    }


}

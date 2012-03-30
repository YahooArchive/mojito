/*
 * YUI Test
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */
package com.yahoo.platform.yuitest.coverage;

import jargs.gnu.CmdLineParser;
import java.io.*;
import java.nio.charset.Charset;

/**
 * Main YUI Test Coverage class.
 * @author Nicholas C. Zakas
 */
public class YUITestCoverage {

    public static void main(String args[]) {

        //----------------------------------------------------------------------
        // Initialize command line parser
        //----------------------------------------------------------------------
        CmdLineParser parser = new CmdLineParser();
        CmdLineParser.Option verboseOpt = parser.addBooleanOption('v', "verbose");
        CmdLineParser.Option helpOpt = parser.addBooleanOption('h', "help");
        CmdLineParser.Option charsetOpt = parser.addStringOption("charset");
        CmdLineParser.Option outputLocationOpt = parser.addStringOption('o', "output");
        CmdLineParser.Option directoryOpt = parser.addBooleanOption('d', "dir");

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

            //Charset option
            String charset = (String) parser.getOptionValue(charsetOpt);
            if (charset == null || !Charset.isSupported(charset)) {
                charset = System.getProperty("file.encoding");
                if (charset == null) {
                    charset = "UTF-8";
                }
                if (verbose) {
                    System.err.println("\n[INFO] Using charset " + charset);
                }
            }

            //get the files to operate on
            String[] fileArgs = parser.getRemainingArgs();

            if (fileArgs.length == 0) {
                usage();
                System.exit(1);
            } 

            String outputLocation = (String) parser.getOptionValue(outputLocationOpt);
            Boolean directories = parser.getOptionValue(directoryOpt) != null;

            if (outputLocation == null){
                if (directories){
                    throw new Exception("-o option is required with -d option.");
                }
                if (verbose) {
                    System.err.println("\n[INFO] Preparing to instrument JavaScript file " + fileArgs[0] + ".");
                }

                in = new InputStreamReader(new FileInputStream(fileArgs[0]), charset);
                JavaScriptInstrumenter instrumenter = new JavaScriptInstrumenter(in, fileArgs[0]);
                out = new OutputStreamWriter(System.out, charset);
                instrumenter.instrument(out, verbose);
            } else{

                if (directories){
                    DirectoryInstrumenter.setVerbose(verbose);

                    //in this case fileArgs[0] and outputLocation are directories
                    DirectoryInstrumenter.instrument(fileArgs[0], outputLocation);
                } else {
                    FileInstrumenter.setVerbose(verbose);

                    //in this case fileArgs[0] and outputLocation are files
                    FileInstrumenter.instrument(fileArgs[0], outputLocation);
                }
            }




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
                "\nUsage: java -jar yuitest-coverage-x.y.z.jar [options] [file|dir]\n\n"

                        + "Global Options\n"
                        + "  -h, --help              Displays this information.\n"
                        + "  --charset <charset>     Read the input file using <charset>.\n"
                        + "  -d, --dir               Input and output (-o) are both directories.\n"
                        + "  -v, --verbose           Display informational messages and warnings.\n"
                        + "  -o <file|dir>           Place the output into <file|dir>. Defaults to stdout.\n\n");
    }


}

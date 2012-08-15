/*
 * YUI Test
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */
package com.yahoo.platform.yuitest.selenium;

import com.yahoo.platform.yuitest.config.TestPageGroup;
import com.yahoo.platform.yuitest.config.TestPage;
import com.yahoo.platform.yuitest.config.TestConfig;
import jargs.gnu.CmdLineParser;
import java.io.*;
import java.net.URL;
import java.util.Date;
import java.util.Properties;

/**
 * Main YUI Test Coverage class.
 * @author Nicholas C. Zakas
 */
public class YUITestSeleniumDriver {

    public static void main(String args[]) {

        //----------------------------------------------------------------------
        // Initialize command line parser
        //----------------------------------------------------------------------
        CmdLineParser parser = new CmdLineParser();
        CmdLineParser.Option verboseOpt = parser.addBooleanOption('v', "verbose");
        CmdLineParser.Option helpOpt = parser.addBooleanOption('h', "help");
        CmdLineParser.Option errorOnFailOpt = parser.addBooleanOption("erroronfail");
        CmdLineParser.Option silentOpt = parser.addBooleanOption("silent");
        CmdLineParser.Option confOpt = parser.addStringOption("conf");
        CmdLineParser.Option hostOpt = parser.addStringOption("host");
        CmdLineParser.Option portOpt = parser.addStringOption("port");
        CmdLineParser.Option browsersOpt = parser.addStringOption("browsers");
        CmdLineParser.Option testsOpt = parser.addStringOption("tests");
        CmdLineParser.Option resultsDirOpt = parser.addStringOption("resultsdir");
        CmdLineParser.Option coverageDirOpt = parser.addStringOption("coveragedir");

        Reader in = null;
        Writer out = null;
        boolean verbose = false;

        try {

            parser.parse(args);

            //Help option
            Boolean help = (Boolean) parser.getOptionValue(helpOpt);
            if (help != null && help.booleanValue()) {
                usage();
                System.exit(0);
            }

            //Verbose option
            verbose = parser.getOptionValue(verboseOpt) != null;

            //load default properties from configuration file
            Properties properties = new Properties();
            properties.load(YUITestSeleniumDriver.class.getResourceAsStream("default.properties"));

            //conf option
            String confFile = (String) parser.getOptionValue(confOpt);
            if (confFile != null){
                if (verbose){
                    System.err.println("[INFO] Loading configuration properties from " + confFile);
                }
                properties.load(new FileInputStream(confFile));
            }

            //load all command-line properties, which override everything else

            //silent option
            boolean silent = parser.getOptionValue(silentOpt) != null;
            if (silent){
                properties.setProperty(SeleniumDriver.CONSOLE_MODE, "silent");
            }

            //host option
            String host = (String) parser.getOptionValue(hostOpt);
            if (host != null){
                properties.setProperty(SeleniumDriver.SELENIUM_HOST, host);
                if (verbose){
                    System.err.println("[INFO] Using command line value for " + SeleniumDriver.SELENIUM_HOST + ": " + host);
                }
            }

            //port option
            String port = (String) parser.getOptionValue(portOpt);
            if (port != null){
                properties.setProperty(SeleniumDriver.SELENIUM_PORT, port);
                if (verbose){
                    System.err.println("[INFO] Using command line value for " + SeleniumDriver.SELENIUM_PORT + ": " + port);
                }
            }

            //browsers option
            String browsers = (String) parser.getOptionValue(browsersOpt);
            if (browsers != null){
                properties.setProperty(SeleniumDriver.SELENIUM_BROWSERS, browsers);
                if (verbose){
                    System.err.println("[INFO] Using command line value for " + SeleniumDriver.SELENIUM_BROWSERS + ": " + browsers);
                }
            }

            //results directory option
            String resultsDir = (String) parser.getOptionValue(resultsDirOpt);
            if (resultsDir != null){
                properties.setProperty(SeleniumDriver.RESULTS_OUTPUTDIR, resultsDir);
                if (verbose){
                    System.err.println("[INFO] Using command line value for " + SeleniumDriver.RESULTS_OUTPUTDIR + ": " + resultsDir);
                }
            }

            //coverage directory option
            String coverageDir = (String) parser.getOptionValue(coverageDirOpt);
            if (coverageDir != null){
                properties.setProperty(SeleniumDriver.COVERAGE_OUTPUTDIR, coverageDir);
                if (verbose){
                    System.err.println("[INFO] Using command line value for " + SeleniumDriver.COVERAGE_OUTPUTDIR + ": " + coverageDir);
                }
            }

            //erroronfail option
            if (parser.getOptionValue(errorOnFailOpt) != null){
                properties.setProperty(SeleniumDriver.ERROR_ON_FAIL, "1");
                if (verbose){
                    System.err.println("[INFO] Using command line value for " + SeleniumDriver.ERROR_ON_FAIL + ": 1 (enabled)");
                }
            }

            //create a new selenium driver with the properties
            SeleniumDriver driver = new SeleniumDriver(properties, verbose);
            SessionResult[] results = null;

            //if --tests is specified, run just those tests
            String testFile = (String) parser.getOptionValue(testsOpt);

            //if there's nothing on the command line, check the properties file
            if (testFile == null){
                testFile = properties.getProperty(SeleniumDriver.YUITEST_TESTS_FILE, null);
            }

            //figure out what to do
            if (testFile != null){
                TestConfig config = new TestConfig();

                if (testFile.startsWith("http://")){  //it's a URL
                    config.load((new URL(testFile)).openStream());
                } else { //it's a local file
                    config.load(new FileInputStream(testFile));
                }
                
                if (verbose){
                    System.err.println("[INFO] Using tests from " + testFile + ".");
                }

                results = driver.runTests(config);
            } else {

                //see if there are any test files
                String[] testFiles = parser.getRemainingArgs();
                if (testFiles.length > 0){

                    if (verbose){
                        System.err.println("[INFO] Using tests from command line.");
                    }

                    TestPageGroup group = new TestPageGroup("", 
                            Integer.parseInt(properties.getProperty(SeleniumDriver.YUITEST_VERSION)),
                            Integer.parseInt(properties.getProperty(SeleniumDriver.YUITEST_TIMEOUT)));

                    for (int i=0; i < testFiles.length; i++){
                        TestPage page = new TestPage(testFiles[i],
                            Integer.parseInt(properties.getProperty(SeleniumDriver.YUITEST_VERSION)),
                            Integer.parseInt(properties.getProperty(SeleniumDriver.YUITEST_TIMEOUT)));
                        group.add(page);
                    }

                    results = driver.runTests(group);
                } else {
                    if (verbose){
                        System.err.println("[INFO] No tests specified to run, exiting...");
                    }
                }

            }

            //output result files
            if (results != null){
                SessionResultFileGenerator generator = new SessionResultFileGenerator(properties, verbose);
                generator.generateAll(results, new Date());
            }

            //verify that there were no errors
            if (driver.getErrors().length > 0){
                throw new Exception(driver.getErrors()[0]);
            }
            
        } catch (CmdLineParser.OptionException e) {

            usage();
            System.exit(1);

        } catch (Exception e) {

            System.err.println("[ERROR] " + e.getMessage());

            if (verbose){
                e.printStackTrace();
            }
            
            System.exit(1);

//        } catch (Exception e) {
//
//            e.printStackTrace();
//            // Return a special error code used specifically by the web front-end.
//            System.exit(2);
        
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
                "\nUsage: java -jar yuitest-selenium-driver-x.y.z.jar [options] [test files]\n\n"

                        + "Global Options\n"
                        + "  -h, --help                Displays this information.\n"
                        + "  --browsers <browsers>     Run tests in these browsers (comma-delimited).\n"
                        + "  --conf <file>             Load options from <file>.\n"
                        + "  --coveragedir <dir>       Output coverage files to <dir>.\n"
                        + "  --erroronfail             Indicates that a test failure should cause\n"
                        + "                            an error to be reported to the console.\n"
                        + "  --host <host>             Use the Selenium host <host>.\n"
                        + "  --port <port>             Use <port> port on the Selenium host.\n"
                        + "  --resultsdir <dir>        Output test result files to <dir>.\n"
                        + "  --silent                  Don't output test results to the console.\n"
                        + "  --tests <file>            Loads test info from <file>.\n"
                        + "  -v, --verbose             Display informational messages and warnings.\n\n");
    }


}

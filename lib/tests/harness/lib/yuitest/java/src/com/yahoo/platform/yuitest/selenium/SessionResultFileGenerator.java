/*
 * YUI Test
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.selenium;

import com.yahoo.platform.yuitest.coverage.report.CoverageReportGenerator;
import com.yahoo.platform.yuitest.coverage.report.CoverageReportGeneratorFactory;
import com.yahoo.platform.yuitest.coverage.results.SummaryCoverageReport;
import com.yahoo.platform.yuitest.results.TestReport;
import com.yahoo.platform.yuitest.writers.ReportWriter;
import com.yahoo.platform.yuitest.writers.ReportWriterFactory;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Properties;

/**
 * Handles generating results files for a SeleniumDriver with the same set of
 * properties.
 * @author Nicholas C. Zakas
 */
public class SessionResultFileGenerator {

    private boolean verbose = false;
    private Properties properties = null;

    public SessionResultFileGenerator(Properties properties, boolean verbose){
        this.properties = properties;
        this.verbose = verbose;
    }

    public void generateAll(List<SessionResult> results, Date timestamp) throws Exception {
        generateAll(results.toArray(new SessionResult[results.size()]), timestamp);
    }

    public void generateAll(SessionResult[] results, Date timestamp) throws Exception {
        SummaryCoverageReport coverageReport = null;
        for (int i=0; i < results.length; i++){
            generateTestResultFile(results[i].getTestReport(), timestamp);

            //if there's a coverage report, merge it in
            if (results[i].getCoverageReport() != null){
                if (coverageReport == null){
                    coverageReport = results[i].getCoverageReport();
                } else {
                    coverageReport.merge(results[i].getCoverageReport());
                }
            }
        }

        //generate the coverage files
        if (coverageReport != null){
            generateCoverageFiles(coverageReport, timestamp);
        }
    }

    private void generateTestResultFile(TestReport report, Date timestamp) throws Exception {
        
        String type = "results";
        String dirname = properties.getProperty(SeleniumDriver.RESULTS_OUTPUTDIR);
        String filenameFormat = properties.getProperty(SeleniumDriver.RESULTS_FILENAME);
        String browser = report.getBrowser().replace("*", "");

        if (dirname == null){
            throw new Exception("Missing '" + type + ".outputdir' configuration parameter.");
        }

        if (filenameFormat == null){
            throw new Exception("Missing '" + type + ".outputdir' configuration parameter.");
        }

        //create the directory if necessary
        File dir = new File(dirname);
        if (!dir.exists()){

            if (verbose){
                System.err.println("[INFO] Creating directory " + dir.getPath());
            }

            dir.mkdirs();
        }

        //format filename
        String filename = filenameFormat.replace("{browser}", browser).replace("{name}", report.getName()).trim();

        int pos = filename.indexOf("{date:");

        if (pos > -1){

            int endpos = filename.indexOf("}", pos);
            String format = filename.substring(pos + 6, endpos);

            //get the format
            SimpleDateFormat formatter = new SimpleDateFormat(format);

            //insert into filename
            filename = filename.replace("{date:" + format + "}", formatter.format(timestamp));
        }

        filename = filename.replaceAll("[^a-zA-Z0-9\\.\\-]", "_").replaceAll("_+", "_");

        if (verbose){
            System.err.println("[INFO] Outputting " + type + " to " + dirname + File.separator + filename);
        }

        Writer out = new OutputStreamWriter(new FileOutputStream(dirname + File.separator + filename), "UTF-8");
        ReportWriter writer = (new ReportWriterFactory<TestReport>()).getWriter( out, "TestReport" + properties.getProperty(SeleniumDriver.RESULTS_FORMAT));

        //String reportText = result.getReport(type);

        writer.write(report, timestamp);
        writer.close();
        
    }

    private void generateCoverageFiles(SummaryCoverageReport report, Date timestamp) throws Exception {
        String dirname = properties.getProperty(SeleniumDriver.COVERAGE_OUTPUTDIR);

        //there should always be a directory
        if (dirname == null){
            throw new Exception("Missing 'coverage.outputdir' configuration parameter.");
        }

        CoverageReportGenerator generator =
                CoverageReportGeneratorFactory.getGenerator(properties.getProperty(SeleniumDriver.COVERAGE_FORMAT), dirname, verbose);
        generator.generate(report, timestamp);
    }
}

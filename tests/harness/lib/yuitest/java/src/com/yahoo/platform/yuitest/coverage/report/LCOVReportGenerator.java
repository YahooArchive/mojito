/*
 *  YUI Test
 *  Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 *  Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 *  Code licensed under the BSD License:
 *      http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.coverage.report;

import com.yahoo.platform.yuitest.coverage.results.DirectoryCoverageReport;
import com.yahoo.platform.yuitest.coverage.results.FileCoverageReport;
import com.yahoo.platform.yuitest.coverage.results.SummaryCoverageReport;
import com.yahoo.platform.yuitest.writers.ReportWriter;
import com.yahoo.platform.yuitest.writers.ReportWriterFactory;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.Date;

/**
 *
 * @author Nicholas C. Zakas
 */
public class LCOVReportGenerator implements CoverageReportGenerator {

    private File outputdir = null;
    private boolean verbose = false;
    private File reportdir = null;

    /**
     * Creates a new LCOVReportGenerator
     * @param outputdir The output directory for the LCOV report.
     * @param verbose True to output additional information to the console.
     */
    public LCOVReportGenerator(String outputdir, boolean verbose){
        this.outputdir = new File(outputdir);
        this.verbose = verbose;
        this.reportdir = new File(outputdir + File.separator + "lcov-report");

        //create directories if not already there
        if (!this.outputdir.exists()){
            this.outputdir.mkdirs();
        }

    }

    /**
     * Generates report files for the given coverage report.
     * @param report The report to generate files for.
     * @throws IOException When the files cannot be written.
     */
    public void generate(SummaryCoverageReport report) throws IOException {
        generate(report, new Date());
    }

    /**
     * Generates report files for the given coverage report.
     * @param report The report to generate files for.
     * @param timestamp The timestamp to tie to the files.
     * @throws IOException When the files cannot be written.
     */
    public void generate(SummaryCoverageReport report, Date timestamp) throws IOException {
        generateLCOVInfo(report, timestamp);

        //create the report directory timestamp
        if (!this.reportdir.exists()){
            this.reportdir.mkdirs();
            if (verbose){
                System.err.println("[INFO] Creating " + reportdir.getCanonicalPath());
            }
        }

        generateIndexPage(report, timestamp);
        DirectoryCoverageReport[] reports = report.getDirectoryReports();
        for (int i=0; i < reports.length; i++){
            generateDirectoryPages(reports[i], timestamp);
        }
    }

    /**
     * Generates the lcov.info file for the coverage information.
     * @param report The coverage information to generate a report for.
     * @param date The date associated with the report.
     * @throws IOException When a file cannot be written to.
     */
    private void generateLCOVInfo(SummaryCoverageReport report, Date date) throws IOException {

        String outputFile = outputdir.getAbsolutePath() + File.separator + "lcov.info";
        Writer out = new OutputStreamWriter(new FileOutputStream(outputFile));

        if (verbose){
            System.err.println("[INFO] Outputting " + outputFile);
        }

        ReportWriter reportWriter = (new ReportWriterFactory<SummaryCoverageReport>()).getWriter(out, "CoverageSummaryReportLCOV");
        reportWriter.write(report, date);
        out.close();
    }

    /**
     * Generates a report page for each file in the coverage information.
     * @param report The coverage information to generate reports for.
     * @param date The date associated with the report.
     * @throws IOException When a file cannot be written to.
     */
    private void generateDirectoryPages(DirectoryCoverageReport report, Date date) throws IOException {

        FileCoverageReport[] fileReports = report.getFileReports();

        //make the directory to mimic the source file
        String parentDir = fileReports[0].getFile().getParent();
        File parent = new File(reportdir.getAbsolutePath() + File.separator + parentDir);
        if (!parent.exists()){
            parent.mkdirs();
        }

        generateDirectoryPage(report, date, parent);

        for (int i=0; i < fileReports.length; i++){            
            generateFilePage(fileReports[i], date, parent);
            generateFunctionPage(fileReports[i], date, parent);
        }
    }

    /**
     * Generates a report page for the directory coverage information.
     * @param report The coverage information to generate reports for.
     * @param date The date associated with the report.
     * @throws IOException When a file cannot be written to.
     */
    private void generateDirectoryPage(DirectoryCoverageReport report, Date date, File parent) throws IOException {
        String outputFile = parent.getAbsolutePath() + File.separator + "index.html";

        if (verbose){
            System.err.println("[INFO] Outputting " + outputFile);
        }

        Writer out = new OutputStreamWriter(new FileOutputStream(outputFile));
        ReportWriter reportWriter = (new ReportWriterFactory<FileCoverageReport>()).getWriter(out, "LCOVHTMLDirectoryReport");
        reportWriter.write(report, date);
        out.close();


    }

    /**
     * Generates an index page for the file coverage information.
     * @param report The coverage information to generate reports for.
     * @param date The date associated with the report.
     * @throws IOException When a file cannot be written to.
     */
    private void generateIndexPage(SummaryCoverageReport report, Date date) throws IOException {
        String outputFile = this.reportdir.getAbsolutePath() + File.separator + "index.html";

        if (verbose){
            System.err.println("[INFO] Outputting " + outputFile);
        }

        Writer out = new OutputStreamWriter(new FileOutputStream(outputFile));
        ReportWriter reportWriter = (new ReportWriterFactory<SummaryCoverageReport>()).getWriter(out, "LCOVHTMLIndexReport");
        reportWriter.write(report, date);
        out.close();


    }

    /**
     * Generates a report page for the file coverage information.
     * @param report The coverage information to generate reports for.
     * @param date The date associated with the report.
     * @throws IOException When a file cannot be written to.
     */
    private void generateFilePage(FileCoverageReport report, Date date, File parent) throws IOException {
        String outputFile = parent.getAbsolutePath() + File.separator + report.getFile().getName() + ".gcov.html";

        if (verbose){
            System.err.println("[INFO] Outputting " + outputFile);
        }

        Writer out = new OutputStreamWriter(new FileOutputStream(outputFile));
        ReportWriter reportWriter = (new ReportWriterFactory<FileCoverageReport>()).getWriter(out, "LCOVHTMLFileReport");
        reportWriter.write(report, date);
        out.close();
    }

    /**
     * Generates a report page for the function coverage information.
     * @param report The coverage information to generate reports for.
     * @param date The date associated with the report.
     * @throws IOException When a file cannot be written to.
     */
    private void generateFunctionPage(FileCoverageReport report, Date date, File parent) throws IOException {
        String outputFile = parent.getAbsolutePath() + File.separator + report.getFile().getName() + ".func.html";

        if (verbose){
            System.err.println("[INFO] Outputting " + outputFile);
        }

        Writer out = new OutputStreamWriter(new FileOutputStream(outputFile));
        ReportWriter reportWriter = (new ReportWriterFactory<FileCoverageReport>()).getWriter(out, "LCOVHTMLFunctionReport");
        reportWriter.write(report, date);
        out.close();
    }


}

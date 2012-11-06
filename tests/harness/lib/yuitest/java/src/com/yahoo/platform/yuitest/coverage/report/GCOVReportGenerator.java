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
public class GCOVReportGenerator implements CoverageReportGenerator {

    private File outputdir = null;
    private boolean verbose = false;

    /**
     * Creates a new GCOVReportGenerator
     * @param outputdir The output directory for the GCOV report.
     * @param verbose True to output additional information to the console.
     */
    public GCOVReportGenerator(String outputdir, boolean verbose){
        this.outputdir = new File(outputdir);
        this.verbose = verbose;
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
     * @param timestamp The timestamp to apply to the files.
     * @throws IOException When the files cannot be written.
     */
    public void generate(SummaryCoverageReport report, Date timestamp) throws IOException {
        //create the report directory now
        if (!outputdir.exists()){
            outputdir.mkdirs();
            if (verbose){
                System.err.println("[INFO] Creating " + outputdir.getCanonicalPath());
            }
        }

        DirectoryCoverageReport[] reports = report.getDirectoryReports();
        for (int i=0; i < reports.length; i++){
            generateDirectories(reports[i], timestamp);
        }
    }

    /**
     * Generates a report page for each file in the coverage information.
     * @param report The coverage information to generate reports for.
     * @param date The date associated with the report.
     * @throws IOException When a file cannot be written to.
     */
    private void generateDirectories(DirectoryCoverageReport report, Date date) throws IOException {

        FileCoverageReport[] fileReports = report.getFileReports();

        //make the directory to mimic the source file
        String parentDir = fileReports[0].getFile().getParent();
        File parent = new File(outputdir.getAbsolutePath() + File.separator + parentDir);
        if (!parent.exists()){
            parent.mkdirs();
        }

        for (int i=0; i < fileReports.length; i++){            
            generateGCOVFile(fileReports[i], date, parent);
        }
    }

    /**
     * Generates a GCOV file for the file coverage information.
     * @param report The coverage information to generate files for.
     * @param date The date associated with the report.
     * @throws IOException When a file cannot be written to.
     */
    private void generateGCOVFile(FileCoverageReport report, Date date, File parent) throws IOException {
        String outputFile = parent.getAbsolutePath() + File.separator + report.getFile().getName() + ".gcov";

        if (verbose){
            System.err.println("[INFO] Outputting " + outputFile);
        }

        Writer out = new OutputStreamWriter(new FileOutputStream(outputFile));
        ReportWriter reportWriter = (new ReportWriterFactory<FileCoverageReport>()).getWriter(out, "GCOVFileReport");
        reportWriter.write(report, date);
        out.close();
    }
}

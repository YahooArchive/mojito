/*
 *  YUI Test
 *  Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 *  Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 *  Code licensed under the BSD License:
 *      http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.coverage.results;

import java.text.DecimalFormat;
import java.util.LinkedList;
import java.util.List;
import org.json.JSONException;

/**
 *
 * @author Nicholas C. Zakas
 */
public class DirectoryCoverageReport {

    private List<FileCoverageReport> fileReports;
    private String directory = "";


    public DirectoryCoverageReport(String directory){
        this.directory = directory;
        this.fileReports = new LinkedList<FileCoverageReport>();
    }

    public String getDirectory(){
        return directory;
    }

//    public String getAbsolutePath(){
//        return directory;  //TODO
//    }

    protected void addFileReport(FileCoverageReport report){
        fileReports.add(report);
    }

    public FileCoverageReport[] getFileReports(){
        return fileReports.toArray(new FileCoverageReport[fileReports.size()]);
    }

    /**
     * Returns the total number of lines tracked.
     * @return The total number of lines tracked.
     * @throws org.json.JSONException
     */
    public int getCoveredLineCount() throws JSONException {
        int sum = 0;
        for (int i=0; i < fileReports.size(); i++){
            sum += fileReports.get(i).getCoveredLineCount();
        }
        return sum;
    }

    /**
     * Returns the number of called lines.
     * @return The number of called lines.
     * @throws org.json.JSONException
     */
    public int getCalledLineCount() throws JSONException {
        int sum = 0;
        for (int i=0; i < fileReports.size(); i++){
            sum += fileReports.get(i).getCalledLineCount();
        }
        return sum;    }

    /**
     * Returns the percentage of lines called.
     * @return The percentage of lines called.
     * @throws org.json.JSONException
     */
    public double getCalledLinePercentage() throws JSONException {
        DecimalFormat twoDForm = new DecimalFormat("#.##");
	return Double.valueOf(twoDForm.format(((double) getCalledLineCount() / (double) getCoveredLineCount()) * 100));
    }

    /**
     * Returns a string indicating the coverage level for lines in the file.
     * This string is suitable for use in generating HTML reports.
     * @return A string value of "high", "med", "low" depending on the coverage.
     * @throws JSONException
     */
    public String getCalledLinePercentageName() throws JSONException {
        double percentage = getCalledLinePercentage();
        if (percentage >= 50){
            return "high";
        } else if (percentage <= 15){
            return "low";
        } else {
            return "med";
        }
    }

    /**
     * Returns the total number of functions tracked.
     * @return The total number of functions tracked.
     * @throws org.json.JSONException
     */
    public int getCoveredFunctionCount() throws JSONException {
        int sum = 0;
        for (int i=0; i < fileReports.size(); i++){
            sum += fileReports.get(i).getCoveredFunctionCount();
        }
        return sum;    }

    /**
     * Returns the number of functions that were called.
     * @return The number of functions that were called.
     * @throws org.json.JSONException
     */
    public int getCalledFunctionCount() throws JSONException {
        int sum = 0;
        for (int i=0; i < fileReports.size(); i++){
            sum += fileReports.get(i).getCalledFunctionCount();
        }
        return sum;
    }

    /**
     * Returns the percentage of functions called.
     * @return The percentage of functions called.
     * @throws org.json.JSONException
     */
    public double getCalledFunctionPercentage() throws JSONException {
        DecimalFormat twoDForm = new DecimalFormat("#.##");
	return Double.valueOf(twoDForm.format(((double) getCalledFunctionCount() / (double) getCoveredFunctionCount()) * 100));
    }

    /**
     * Returns a string indicating the coverage level for lines in the file.
     * This string is suitable for use in generating HTML reports.
     * @return A string value of "high", "med", "low" depending on the coverage.
     * @throws JSONException
     */
    public String getCalledFunctionPercentageName() throws JSONException {
        double percentage = getCalledFunctionPercentage();
        if (percentage >= 90){
            return "high";
        } else if (percentage <= 75){
            return "low";
        } else {
            return "med";
        }
    }
}

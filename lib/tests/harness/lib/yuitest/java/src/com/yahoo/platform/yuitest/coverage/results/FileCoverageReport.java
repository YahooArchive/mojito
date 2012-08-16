/*
 * YUI Test
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.coverage.results;

import java.io.File;
import java.text.DecimalFormat;
import java.util.Arrays;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Represents a single item on a report.
 * @author Nicholas C. Zakas
 */
public class FileCoverageReport {

    private JSONObject report1;
    private String filename;
    private FileLine[] lines;
    private FileFunction[] functions;
    private String path;

    /**
     * Creates a new FileCoverageReport for the given filename.
     * @param filename The filename of the item.
     * @param report1 The associated coverage report1.
     */
    protected FileCoverageReport(String filename, JSONObject data) throws JSONException {
        this.filename = filename;
        this.report1 = data;
        this.path = data.getString("path");
        createFileLines();
        createFileFunctions();
    }

    /**
     * Creates the FileLine objects for the file.
     * @throws org.json.JSONException
     */
    private void createFileLines() throws JSONException {
        int count = report1.getJSONArray("code").length();
        lines = new FileLine[count];

        for (int i=0; i < count; i++){
            lines[i] = new FileLine(i+1, report1.getJSONArray("code").getString(i), report1.getJSONObject("lines").optInt(String.valueOf(i+1), -1));
        }
    }

    /**
     * Creates the FileFunction objects for the file.
     * @throws org.json.JSONException
     */
    private void createFileFunctions() throws JSONException {
        JSONObject functionData = report1.getJSONObject("functions");
        String[] keys = JSONObject.getNames(functionData);
        functions = new FileFunction[keys.length];

        for (int i=0; i < keys.length; i++){
            functions[i] = new FileFunction(keys[i], functionData.optInt(keys[i], -1));
        }

        Arrays.sort(functions, new FileFunctionComparator());
    }

    /**
     * Returns the filename for this item.
     * @return The filename for this item.
     */
    public String getFilename(){
        return filename;
    }

    public File getFile(){
        return new File(filename);
    }

    /**
     * Returns the file path for this item.
     * @return The file path for this item.
     */
    public String getAbsolutePath(){
        return path;
    }
    
    public String getFileParent(){
        String parent = getFile().getParent();
        if (parent != null){
            return parent.replace("\\", "/");
        } else {
            return "base";
        }
    }

    /**
     * Returns the total number of lines tracked.
     * @return The total number of lines tracked.
     * @throws org.json.JSONException
     */
    public int getCoveredLineCount() throws JSONException {
        return report1.getInt("coveredLines");
    }

    /**
     * Returns the number of called lines.
     * @return The number of called lines.
     * @throws org.json.JSONException
     */
    public int getCalledLineCount() throws JSONException {
        return report1.getInt("calledLines");
    }    
        
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
        return report1.getInt("coveredFunctions");
    }

    /**
     * Returns the number of functions that were called.
     * @return The number of functions that were called.
     * @throws org.json.JSONException
     */
    public int getCalledFunctionCount() throws JSONException {
        return report1.getInt("calledFunctions");
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

    /**
     * Returns all information about a given line.
     * @param line The one-based number of the line to retrieve.
     * @return A FileLine for the specified line.
     * @throws org.json.JSONException
     */
    public FileLine getLine(int line) throws JSONException{
        return lines[line-1];
    }

    /**
     * Returns all information about all lines.
     * @return An array of lines for the file.
     * @throws org.json.JSONException
     */
    public FileLine[] getLines() throws JSONException {
        return lines;
    }

    /**
     * Returns all information about all functions.
     * @return An array of functions for the file.
     * @throws org.json.JSONException
     */
    public FileFunction[] getFunctions() throws JSONException {
        return functions;
    }

    /**
     * Returns the number of times that a given line was called.
     * @param line The line number to check.
     * @return The number of times that the lines was called.
     * @throws org.json.JSONException
     */
    public int getLineCallCount(int line)  throws JSONException{

        //error for uncovered lines
        try {
            return report1.getJSONObject("lines").getInt(String.valueOf(line));
        } catch (Exception ex){
            return -1;
        }
    }

    /**
     * Returns the number of times a given function was called.
     * @param functionName The name of the function. This is the function
     *      name followed by a colon followed by the line number.
     * @return The number of times that the function was called.
     * @throws org.json.JSONException
     */
    public int getFunctionCallCount(String functionName) throws JSONException {
        return report1.getJSONObject("functions").getInt(functionName);
    }

    /**
     * Returns all function names stored in the report item.
     * @return All function names stored in the report item.
     * @throws org.json.JSONException
     */
    public String[] getFunctionNames() throws JSONException {
        return JSONObject.getNames(report1.getJSONObject("functions"));
    }

    /**
     * Returns the JSONObject associated with the report item.
     * @return The JSONObject associated with the report item.
     */
    public JSONObject toJSONObject() {
        return report1;
    }
    
    /**
     * Returns a name suitable for use as a filename in which the report can
     * be saved.
     * @return A name containing only A-Z,0-9, and _.
     */
    public String getReportName(){
        return filename.replaceAll("[^A-Za-z0-9\\.]", "_");
    }
    
    /**
     * Returns the JSON string representing the item.
     * @return The JSON string representing the item.
     */
    @Override
    public String toString(){
        return report1.toString();
    }

    /**
     * Merges the report1 in another report with this report.
     * @param report The report to merge report1 from.
     */
    public void merge(FileCoverageReport report) throws JSONException {

        //make sure the file is the same
        if (this.getAbsolutePath().equals(report.getAbsolutePath())){

            //update calledFunctions
            if (this.getCalledFunctionCount() < report.getCalledFunctionCount()){
                report1.put("calledFunctions", report.getCalledFunctionCount());
            }

            //update calledLines
            if (this.getCalledLineCount() < report.getCalledLineCount()){
                report1.put("calledLines", report.getCalledLineCount());
            }

            //update line calls
            for (int i=0; i < lines.length; i++){
                report1.getJSONObject("lines").put(String.valueOf(lines[i].getLineNumber()),
                        (lines[i].getCallCount() + report.getLineCallCount(lines[i].getLineNumber())));

            }

            //update function calls
            String[] functionNames = getFunctionNames();
            for (int i=0; i < functionNames.length; i++){
                report1.getJSONObject("functions").put(functionNames[i],
                        (getFunctionCallCount(functionNames[i]) + report.getFunctionCallCount(functionNames[i])));

            }

            //re-create file lines and functions
            createFileLines();
            createFileFunctions();
        } else {
            throw new IllegalArgumentException("Expected a report for " + this.getAbsolutePath());
        }

    }
}

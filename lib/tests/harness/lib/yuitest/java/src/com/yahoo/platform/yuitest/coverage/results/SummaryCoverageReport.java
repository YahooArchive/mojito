/*
 * YUI Test
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.coverage.results;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.text.DecimalFormat;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Represents a code coverage report.
 * @author Nicholas C. Zakas
 */
public class SummaryCoverageReport {

    private JSONObject data;
    private FileCoverageReport[] files;
    private HashMap<String,DirectoryCoverageReport> directories;
    
    //--------------------------------------------------------------------------
    // Constructors
    //--------------------------------------------------------------------------
    
    /**
     * Creates a new report object from data in a file.
     * @param file The file from which to read the JSON data.
     * @throws java.io.IOException
     * @throws org.json.JSONException
     */
    public SummaryCoverageReport(File file) throws IOException, JSONException {
        this(new InputStreamReader(new FileInputStream(file)));
    }

    /**
     * Creates a new report object from data in multiple files.
     * @param file The file from which to read the JSON data.
     * @throws java.io.IOException
     * @throws org.json.JSONException
     */
    public SummaryCoverageReport(File[] files) throws IOException, JSONException {

        //start with the first file
        this(files[0]);

        //merge the others
        for (int i=1; i < files.length; i++){
            merge(new SummaryCoverageReport(files[i]));
        }
    }

    /**
     * Creates a new report object from a reader.
     * @param in The reader containing JSON information.
     * @throws java.io.IOException
     * @throws org.json.JSONException
     */
    public SummaryCoverageReport(Reader in) throws IOException, JSONException {
        StringBuilder builder = new StringBuilder();
        int c;
        
        while((c = in.read()) != -1){
            builder.append((char)c);
        }
        
        this.data = new JSONObject(builder.toString());
        this.directories = new HashMap<String,DirectoryCoverageReport>();
        generateFileReports();
    }
    
    /**
     * Creates a new report object from a JSON object.
     * @param data The JSON object containing coverage data.
     */
    public SummaryCoverageReport(JSONObject data)  throws JSONException{
        this.data = data;
        generateFileReports();
    }
  
    /**
     * Generates FileCoverageReport objects for every file in the report.
     */
    private void generateFileReports()  throws JSONException{
        String[] filenames = getFilenames();
        Arrays.sort(filenames);
        files = new FileCoverageReport[filenames.length];
        directories.clear();
        
        for (int i=0; i < filenames.length; i++){
            files[i] = new FileCoverageReport(filenames[i], data.getJSONObject(filenames[i]));
            if (!directories.containsKey(files[i].getFileParent())){
                directories.put(files[i].getFileParent(), new DirectoryCoverageReport(files[i].getFileParent()));
            }
            directories.get(files[i].getFileParent()).addFileReport(files[i]);
        }        
    }
    
    /**
     * Returns the filenames tracked in the report.
     * @return The filenames tracked in the report.
     */
    public String[] getFilenames(){
        String[] filenames = JSONObject.getNames(data);
        Arrays.sort(filenames);
        return filenames;
    }

    public DirectoryCoverageReport[] getDirectoryReports(){
        //return directories.values().toArray(new DirectoryCoverageReport[directories.size()]);
        DirectoryCoverageReport[] reports = directories.values().toArray(
            new DirectoryCoverageReport[directories.size()]);
        Arrays.sort(reports, new Comparator<DirectoryCoverageReport>() {
            public int compare(DirectoryCoverageReport o1,
                    DirectoryCoverageReport o2) {
                return o1.getDirectory().compareTo(o2.getDirectory());
            }
        });
        return reports;
    }
    
    /**
     * Returns all FileCoverageReport objects in the report.
     * @return All FileCoverageReport objects in the report.
     */
    public FileCoverageReport[] getFileReports(){
        return files;
    }
    
    /**
     * Returns the FileCoverageReport in the given position in the report.
     * @param index The position in the report to retrieve.
     * @return The FileCoverageReport for the position.
     */
    public FileCoverageReport getFileReport(int index){
        return files[index];
    }
    
    /**
     * Returns the FileCoverageReport associated with a given filename.
     * @param filename The filename to retrieve.
     * @return The FileCoverageReport if found or null if not found.
     */
    public FileCoverageReport getFileReport(String filename){
        for (int i=0; i < files.length; i++){
            if (files[i].getFilename().equals(filename)){
                return files[i];
            }
        }
        return null;
    }

    /**
     * Returns the total number of lines tracked.
     * @return The total number of lines tracked.
     * @throws org.json.JSONException
     */
    public int getCoveredLineCount() throws JSONException {
        int sum = 0;
        for (int i=0; i < files.length; i++){
            sum += files[i].getCoveredLineCount();
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
        for (int i=0; i < files.length; i++){
            sum += files[i].getCalledLineCount();
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
        for (int i=0; i < files.length; i++){
            sum += files[i].getCoveredFunctionCount();
        }
        return sum;    }

    /**
     * Returns the number of functions that were called.
     * @return The number of functions that were called.
     * @throws org.json.JSONException
     */
    public int getCalledFunctionCount() throws JSONException {
        int sum = 0;
        for (int i=0; i < files.length; i++){
            sum += files[i].getCalledFunctionCount();
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

    public JSONObject toJSONObject(){
        return data;
    }

    /**
     * Include another report's data in this report.
     * @param otherReport The other report to merge.
     */
    public void merge(SummaryCoverageReport otherReport) throws JSONException{

        FileCoverageReport[] reports = otherReport.getFileReports();

        boolean needsRegeneration = false;

        for (int i=0; i < reports.length; i++){
            FileCoverageReport fileReport = getFileReport(reports[i].getFilename());
            if (fileReport != null){
                fileReport.merge(reports[i]);
            } else {
                //need to add to the JSON object
                data.put(reports[i].getFilename(), otherReport.toJSONObject().getJSONObject(reports[i].getFilename()));
                needsRegeneration = true;
            }
        }

        //regenerate file reports if necessary
        if (needsRegeneration){
            generateFileReports();
        }
    }
    
}

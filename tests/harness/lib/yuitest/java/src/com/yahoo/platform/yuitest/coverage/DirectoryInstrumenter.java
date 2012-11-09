/*
 * YUI Test Coverage
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */
package com.yahoo.platform.yuitest.coverage;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.LinkedList;
import java.util.List;
import org.antlr.runtime.RecognitionException;


/**
 * Encapsulates instrumenting all files in a inputDir.
 * @author Nicholas C. Zakas
 */
public class DirectoryInstrumenter {

    private static boolean verbose = false;

    public static boolean isVerbose() {
        return verbose;
    }

    public static void setVerbose(boolean verbose) {
        DirectoryInstrumenter.verbose = verbose;
    }

    public static void instrument(String inputDir, String outputDir) 
            throws FileNotFoundException, UnsupportedEncodingException,
            IOException, RecognitionException {

        //normalize
        if (!inputDir.endsWith(File.separator)){
            inputDir = inputDir + File.separator;
        }
        if (!outputDir.endsWith(File.separator)){
            outputDir = outputDir + File.separator;
        }

        List<String> filenames = getFilenames(inputDir);

        for (int i=0; i < filenames.size(); i++){
            String inputFilename = filenames.get(i);
            String outputFilename = outputDir + inputFilename.substring(inputFilename.indexOf(inputDir) + inputDir.length());
            
            //create the directories if necessary
            File dir = new File(outputFilename.substring(0, outputFilename.lastIndexOf(File.separator)));
            if (!dir.exists()){

                if (verbose){
                    System.err.println("[INFO] Creating directory " + dir.getPath());
                }
                
                dir.mkdirs();
            }
            
            FileInstrumenter.setVerbose(verbose);
            FileInstrumenter.instrument(inputFilename, outputFilename);
        }

    }



    /**
     * Retrieves a recursive list of all JavaScript files in the inputDir.
     * @param inputDir The inputDir to search.
     * @return List of all JavaScript files in the inputDir and subdirectories.
     * @throws IllegalArgumentException When the inputDir cannot be read.
     * @throws FileNotFoundException When the inputDir doesn't exist.
     */
    private static List<String> getFilenames(String directory) throws IllegalArgumentException, FileNotFoundException {

        File dir = new File(directory);

        //validate the inputDir first
        if (!dir.isDirectory()){
            throw new FileNotFoundException("'" + directory + "' is not a valid directory.");
        }
        if (!dir.canRead()){
            throw new IllegalArgumentException("'" + directory + "' cannot be read.");
        }

        List<String> filenames = new LinkedList<String>();
        
        //TODO: Gotta be a better way...
        File[] files = dir.listFiles();
        for (int i=0; i < files.length; i++){
            if (files[i].isFile() && files[i].getName().endsWith(".js")){
                filenames.add(files[i].getPath());
            } else if (files[i].isDirectory()){
                filenames.addAll(getFilenames(files[i].getPath()));
            }
        }

        return filenames;

    }


}

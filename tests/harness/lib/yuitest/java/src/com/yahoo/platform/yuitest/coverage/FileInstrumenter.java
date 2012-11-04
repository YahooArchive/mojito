/*
 * YUI Test Coverage
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.coverage;

import java.io.File;
import org.antlr.runtime.RecognitionException;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Reader;
import java.io.UnsupportedEncodingException;
import java.io.Writer;

/**
 * Handles instrumenting a single file.
 * @author Nicholas C. Zakas
 */
public class FileInstrumenter {

    private static boolean verbose = false;

    /**
     * Determines if the class is in verbose mode.
     * @return
     */
    public static boolean isVerbose() {
        return verbose;
    }

    /**
     * Sets the verbose flag, which outputs debugging information.
     * @param verbose The new value for the verbose flag.
     */
    public static void setVerbose(boolean verbose) {
        FileInstrumenter.verbose = verbose;
    }

    /**
     * Instruments a single file.
     * @param inputFilename The filename to instrument.
     * @param outputFilename The output file.
     * @throws FileNotFoundException If the input file cannot be read.
     * @throws UnsupportedEncodingException If charset is invalid.
     * @throws IOException If an error occurs during writing.
     * @throws RecognitionException If the file has a syntax error.
     */
    public static void instrument(String inputFilename, String outputFilename)
            throws FileNotFoundException, UnsupportedEncodingException, 
            IOException, RecognitionException {
        
        instrument(inputFilename, outputFilename, "UTF-8");
    }

    /**
     * Instruments a single file.
     * @param inputFilename The filename to instrument.
     * @param outputFilename The output file.
     * @param charset The character set to use.
     * @throws FileNotFoundException If the input file cannot be read.
     * @throws UnsupportedEncodingException If charset is invalid.
     * @throws IOException If an error occurs during writing.
     * @throws RecognitionException If the file has a syntax error.
     */
    public static void instrument(String inputFilename, String outputFilename, 
            String charset) throws FileNotFoundException,
            UnsupportedEncodingException, IOException, RecognitionException {

        if (verbose) {
            System.err.println("\n[INFO] Preparing to instrument JavaScript file " + inputFilename + ".");
            System.err.println("\n[INFO] Output file will be " + outputFilename + ".");
        }

        Reader in = null;
        Writer out = null;

        try {

            File inputFile = new File(inputFilename);
            
            in = new InputStreamReader(new FileInputStream(inputFilename), charset);
            out = new OutputStreamWriter(new FileOutputStream(outputFilename), charset);

            //if the file is empty, don't bother instrumenting
            //if (inputFile.length() > 0){
                //strip out relative paths - that just messes up coverage report writing
                JavaScriptInstrumenter instrumenter = new JavaScriptInstrumenter(in, inputFilename.replaceAll("\\.\\./", ""), (new File(inputFilename)).getCanonicalPath());
                instrumenter.instrument(out, verbose);
            //} else {
            //    out.write("");
            //}
        } catch (IOException ex){
            in.close();
            if (out != null){
                out.close();
            }
            throw ex;
        }

        if (verbose) {
            System.err.println("\n[INFO] Created file " + outputFilename + ".");
        }

    }

}

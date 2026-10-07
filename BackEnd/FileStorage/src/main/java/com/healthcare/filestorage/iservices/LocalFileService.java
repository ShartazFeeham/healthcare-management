package com.healthcare.filestorage.iservices;

import com.healthcare.filestorage.exception.LocalFileHandlingException;
import org.springframework.web.multipart.MultipartFile;

public interface LocalFileService {
    /** Stores the file and returns the public URL it can be fetched from. */
    String upload(MultipartFile file) throws LocalFileHandlingException;

    byte[] read(String nameOrUrl) throws LocalFileHandlingException;

    void delete(String nameOrUrl) throws LocalFileHandlingException;
}

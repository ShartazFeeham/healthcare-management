package com.healthcare.filestorage.controllers;

import com.healthcare.filestorage.exception.LocalFileHandlingException;
import com.healthcare.filestorage.iservices.LocalFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.concurrent.TimeUnit;

@RestController
@CrossOrigin("*")
@RequiredArgsConstructor
public class FileController {

    private final LocalFileService fileService;

    @PostMapping({"/v1/upload", "/v2/upload"})
    public ResponseEntity<String> upload(@RequestParam("file") MultipartFile file) throws LocalFileHandlingException {
        return ResponseEntity.ok(fileService.upload(file));
    }

    @GetMapping("/files/{name}")
    public ResponseEntity<byte[]> serve(@PathVariable String name) throws LocalFileHandlingException {
        return body(name);
    }

    @GetMapping({"/v1/download", "/v2/download"})
    public ResponseEntity<byte[]> download(@RequestParam String filePath) throws LocalFileHandlingException {
        return body(filePath);
    }

    @DeleteMapping({"/v1/delete", "/v2/delete"})
    public ResponseEntity<String> delete(@RequestParam String url) throws LocalFileHandlingException {
        fileService.delete(url);
        return ResponseEntity.ok("File deleted successfully.");
    }

    private ResponseEntity<byte[]> body(String name) throws LocalFileHandlingException {
        MediaType type = MediaTypeFactory.getMediaType(name).orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok().contentType(type)
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS))
                .body(fileService.read(name));
    }
}

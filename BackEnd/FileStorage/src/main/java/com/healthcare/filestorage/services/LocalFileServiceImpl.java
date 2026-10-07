package com.healthcare.filestorage.services;

import com.healthcare.filestorage.exception.LocalFileHandlingException;
import com.healthcare.filestorage.iservices.LocalFileService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

/** Files live on the local disk (HC_STORAGE_DIR) and are served back by {@code GET /files/{name}}. */
@Service
public class LocalFileServiceImpl implements LocalFileService {

    private final Path root;
    private final String publicBase;

    public LocalFileServiceImpl(@Value("${hc.storage.dir:./storage}") String dir,
                                @Value("${hc.storage.public-base:http://localhost:5200}") String publicBase) throws IOException {
        this.root = Path.of(dir).toAbsolutePath().normalize();
        this.publicBase = publicBase;
        Files.createDirectories(root);
    }

    @Override
    public String upload(MultipartFile file) throws LocalFileHandlingException {
        String original = file.getOriginalFilename() == null ? "file" : Path.of(file.getOriginalFilename()).getFileName().toString();
        String name = UUID.randomUUID() + "-" + original.replaceAll("[^A-Za-z0-9._-]", "_");
        try {
            file.transferTo(root.resolve(name));
            return publicBase + "/files/" + name;
        } catch (IOException e) {
            throw new LocalFileHandlingException("Failed to store the file: " + e.getMessage());
        }
    }

    @Override
    public byte[] read(String nameOrUrl) throws LocalFileHandlingException {
        Path file = resolve(nameOrUrl);
        try {
            return Files.readAllBytes(file);
        } catch (IOException e) {
            throw new LocalFileHandlingException("File not found: " + nameOrUrl);
        }
    }

    @Override
    public void delete(String nameOrUrl) throws LocalFileHandlingException {
        try {
            Files.deleteIfExists(resolve(nameOrUrl));
        } catch (IOException e) {
            throw new LocalFileHandlingException("Failed to delete the file: " + e.getMessage());
        }
    }

    /** Accepts a bare name or a full URL; strips directories so nothing outside the root can be reached. */
    private Path resolve(String nameOrUrl) {
        String name = nameOrUrl.substring(nameOrUrl.lastIndexOf('/') + 1);
        return root.resolve(Path.of(name).getFileName().toString());
    }
}

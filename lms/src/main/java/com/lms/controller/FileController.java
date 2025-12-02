// src/main/java/com/lms/controller/FileController.java
package com.lms.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @GetMapping("/download/{type}/{filename:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String type, @PathVariable String filename) {
        try {
            String directory;
            switch (type) {
                case "notes":
                    directory = "uploads/notes/";
                    break;
                case "assignments":
                    directory = "uploads/assignments/";
                    break;
                case "submissions":
                    directory = "uploads/submissions/";
                    break;
                default:
                    return ResponseEntity.badRequest().build();
            }

            Path filePath = Paths.get(directory).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = "application/octet-stream";

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                "attachment; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
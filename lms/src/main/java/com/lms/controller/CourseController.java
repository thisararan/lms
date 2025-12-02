package com.lms.controller;

import com.lms.dto.CourseDto;
import com.lms.security.UserPrincipal;
import com.lms.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    public ResponseEntity<List<CourseDto>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCourse(@PathVariable Long id) {
        try {
            CourseDto course = courseService.getCourseById(id);
            return ResponseEntity.ok(course);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new com.lms.exception.ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createCourse(@RequestBody CourseDto courseDto,
                                          @AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            // Use the universal method that handles both teachers and admins
            CourseDto course = courseService.createCourseUniversal(courseDto, currentUser.getId());
            return ResponseEntity.ok(course);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new com.lms.exception.ApiResponse(false, e.getMessage()));
        }
    }

    // NEW: Admin-specific course creation endpoint
    @PostMapping("/admin")
    public ResponseEntity<?> createCourseAsAdmin(@RequestBody CourseDto courseDto,
                                                 @AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            CourseDto course = courseService.createCourseAsAdmin(courseDto, currentUser.getId());
            return ResponseEntity.ok(course);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new com.lms.exception.ApiResponse(false, e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCourse(@PathVariable Long id, @RequestBody CourseDto courseDto) {
        try {
            CourseDto course = courseService.updateCourse(id, courseDto);
            return ResponseEntity.ok(course);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new com.lms.exception.ApiResponse(false, e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        try {
            courseService.deleteCourse(id);
            return ResponseEntity.ok(new com.lms.exception.ApiResponse(true, "Course deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new com.lms.exception.ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<CourseDto>> searchCourses(@RequestParam String q) {
        return ResponseEntity.ok(courseService.searchCourses(q));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<CourseDto>> getCoursesByCategory(@PathVariable String category) {
        return ResponseEntity.ok(courseService.getCoursesByCategory(category));
    }
}
package com.lms.controller;

import com.lms.dto.UserDto;
import com.lms.service.UserService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ✅ Create new Teacher
    @PostMapping("/teachers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createTeacher(@RequestBody UserDto userDto) {
        try {
            UserDto teacher = userService.createTeacher(userDto);
            return ResponseEntity.ok(new ApiResponse(true, "Teacher created successfully", teacher));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to create teacher: " + e.getMessage()));
        }
    }

    // ✅ Create new Admin
    @PostMapping("/admins")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createAdmin(@RequestBody UserDto userDto) {
        try {
            UserDto admin = userService.createAdmin(userDto);
            return ResponseEntity.ok(new ApiResponse(true, "Admin created successfully", admin));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to create admin: " + e.getMessage()));
        }
    }

    // ✅ Create Student (Updated with proper request handling)
    @PostMapping("/students")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createStudent(@RequestBody UserDto userDto) {
        try {
            UserDto student = userService.createStudent(userDto);
            return ResponseEntity.ok(new ApiResponse(true, "Student created successfully", student));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to create student: " + e.getMessage()));
        }
    }

    // ✅ Get all Teachers
    @GetMapping("/teachers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllTeachers() {
        try {
            List<UserDto> teachers = userService.getAllTeachers();
            return ResponseEntity.ok(new ApiResponse(true, "Teachers retrieved successfully", teachers));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to retrieve teachers: " + e.getMessage()));
        }
    }

    // ✅ Get all Students (Updated)
    @GetMapping("/students")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllStudents() {
        try {
            List<UserDto> students = userService.getAllStudents();
            return ResponseEntity.ok(new ApiResponse(true, "Students retrieved successfully", students));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to retrieve students: " + e.getMessage()));
        }
    }

    // ✅ Get Student by ID (NEW)
    @GetMapping("/students/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getStudentById(@PathVariable Long id) {
        try {
            UserDto student = userService.getUserById(id);
            return ResponseEntity.ok(new ApiResponse(true, "Student retrieved successfully", student));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Student not found: " + e.getMessage()));
        }
    }

    // ✅ Get all Students with passwords (NEW)
    @GetMapping("/students/with-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllStudentsWithPassword() {
        try {
            List<UserDto> students = userService.getAllStudentsWithPassword();
            return ResponseEntity.ok(new ApiResponse(true, "Students with passwords retrieved successfully", students));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to retrieve students with passwords: " + e.getMessage()));
        }
    }

    // ✅ Get Student by ID with password (NEW)
    @GetMapping("/students/{id}/with-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getStudentByIdWithPassword(@PathVariable Long id) {
        try {
            UserDto student = userService.getUserByIdWithPassword(id);
            return ResponseEntity.ok(new ApiResponse(true, "Student with password retrieved successfully", student));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Student not found: " + e.getMessage()));
        }
    }

    // ✅ Update Student (NEW - Specific endpoint for students)
    @PutMapping("/students/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStudent(@PathVariable Long id, @RequestBody UserDto userDto) {
        try {
            UserDto updatedStudent = userService.updateUser(id, userDto);
            return ResponseEntity.ok(new ApiResponse(true, "Student updated successfully", updatedStudent));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to update student: " + e.getMessage()));
        }
    }

    // ✅ Delete Student (NEW - Specific endpoint for students)
    @DeleteMapping("/students/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteStudent(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(new ApiResponse(true, "Student deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to delete student: " + e.getMessage()));
        }
    }

    // ✅ Get all Admins
    @GetMapping("/admins")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllAdmins() {
        try {
            List<UserDto> admins = userService.getAllAdmins();
            return ResponseEntity.ok(new ApiResponse(true, "Admins retrieved successfully", admins));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to retrieve admins: " + e.getMessage()));
        }
    }

    // ✅ Get specific user by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            UserDto user = userService.getUserById(id);
            return ResponseEntity.ok(new ApiResponse(true, "User retrieved successfully", user));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "User not found: " + e.getMessage()));
        }
    }

    // ✅ Get all Users (any role)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<UserDto> users = userService.getAllUsers();
            return ResponseEntity.ok(new ApiResponse(true, "Users retrieved successfully", users));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to retrieve users: " + e.getMessage()));
        }
    }

    // ✅ Update a User
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UserDto userDto) {
        try {
            UserDto updatedUser = userService.updateUser(id, userDto);
            return ResponseEntity.ok(new ApiResponse(true, "User updated successfully", updatedUser));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to update user: " + e.getMessage()));
        }
    }

    // ✅ Delete a User
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(new ApiResponse(true, "User deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to delete user: " + e.getMessage()));
        }
    }

    // ✅ Admin Dashboard Statistics
    @GetMapping("/dashboard/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAdminDashboardStats() {
        try {
            Map<String, Object> dashboardStats = userService.getAdminDashboardStats();
            return ResponseEntity.ok(new ApiResponse(true, "Dashboard stats retrieved successfully", dashboardStats));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to fetch dashboard stats: " + e.getMessage()));
        }
    }

    // ✅ User Role Statistics
    @GetMapping("/statistics/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserStatistics() {
        try {
            Map<String, Object> userStats = userService.getUserStatistics();
            return ResponseEntity.ok(new ApiResponse(true, "User statistics retrieved successfully", userStats));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to fetch user statistics: " + e.getMessage()));
        }
    }

    // ✅ Get users by role
    @GetMapping("/role/{role}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUsersByRole(@PathVariable String role) {
        try {
            List<UserDto> users = userService.getUsersByRole(role);
            return ResponseEntity.ok(new ApiResponse(true, "Users retrieved successfully", users));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to retrieve users: " + e.getMessage()));
        }
    }

    // ✅ Update user status
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            UserDto updatedUser = userService.updateUserStatus(id, status);
            return ResponseEntity.ok(new ApiResponse(true, "User status updated successfully", updatedUser));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to update user status: " + e.getMessage()));
        }
    }

    // ✅ Search users by name or email
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> searchUsers(@RequestParam String query) {
        try {
            List<UserDto> users = userService.searchUsers(query);
            return ResponseEntity.ok(new ApiResponse(true, "Users found successfully", users));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to search users: " + e.getMessage()));
        }
    }

    // ✅ Unified API Response class
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ApiResponse {
        private boolean success;
        private String message;
        private Object data;

        public ApiResponse(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public ApiResponse(boolean success) {
            this.success = success;
        }
    }
}
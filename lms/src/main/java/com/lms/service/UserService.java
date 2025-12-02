// src/main/java/com/lms/service/UserService.java
package com.lms.service;

import com.lms.dto.UserDto;
import com.lms.entity.User;
import com.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Convert User → UserDto (without password)
    private UserDto convertToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole() != null ? user.getRole().name() : "STUDENT");
        dto.setStudentId(user.getStudentId());
        dto.setSubject(user.getSubject());
        dto.setQualification(user.getQualification());
        dto.setPhone(user.getPhone());
        dto.setStatus(user.getStatus() != null ? user.getStatus().name() : "ACTIVE");
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }

    // Convert User → UserDto (WITH original password – only for admin)
    private UserDto convertToDtoWithOriginalPassword(User user) {
        UserDto dto = convertToDto(user);
        // ✅ Return the ORIGINAL password (tempPassword), not the encoded one
        dto.setPassword(user.getTempPassword());
        return dto;
    }

    // Get all users
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // Get user by ID (without password)
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return convertToDto(user);
    }

    // Get user by ID (WITH original password – admin only)
    public UserDto getUserByIdWithPassword(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToDtoWithOriginalPassword(user);
    }

    // Get all students (WITH original passwords for admin)
    public List<UserDto> getAllStudents() {
        return userRepository.findByRole(User.Role.STUDENT).stream()
                .map(this::convertToDtoWithOriginalPassword)
                .collect(Collectors.toList());
    }

    // ✅ Get all students with original passwords
    public List<UserDto> getAllStudentsWithPassword() {
        return getAllStudents();
    }

    // Get all teachers
    public List<UserDto> getAllTeachers() {
        return userRepository.findByRole(User.Role.TEACHER).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // Get all admins
    public List<UserDto> getAllAdmins() {
        return userRepository.findByRole(User.Role.ADMIN).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // Get users by role (string)
    public List<UserDto> getUsersByRole(String role) {
        try {
            User.Role userRole = User.Role.valueOf(role.toUpperCase());
            return userRepository.findByRole(userRole).stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role: " + role);
        }
    }

    // Search users (used by admin search bar)
    public List<UserDto> searchUsers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return userRepository.searchUsers(query.trim()).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // ✅ FIXED: Create user with specific role - PROPERLY store original password
    private UserDto createUserWithRole(UserDto userDto, User.Role role) {
        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new RuntimeException("Email already exists: " + userDto.getEmail());
        }

        User user = new User();
        user.setName(userDto.getName());
        user.setEmail(userDto.getEmail());

        // ✅ FIX: Store ORIGINAL password in tempPassword field
        String originalPassword = userDto.getPassword();
        if (originalPassword != null && !originalPassword.trim().isEmpty()) {
            user.setTempPassword(originalPassword); // Store original password
        } else {
            // Generate a default password if not provided
            String defaultPassword = "student123";
            user.setTempPassword(defaultPassword);
            originalPassword = defaultPassword;
        }

        // Encode password for security and store in password field
        user.setPassword(passwordEncoder.encode(originalPassword));
        user.setRole(role);
        user.setStudentId(userDto.getStudentId());
        user.setPhone(userDto.getPhone());
        user.setQualification(userDto.getQualification());
        user.setSubject(userDto.getSubject());
        user.setStatus(User.UserStatus.ACTIVE);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);
        return convertToDtoWithOriginalPassword(saved); // admin sees original password
    }

    // ✅ FIXED: Update user - PROPERLY handle password update
    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (userDto.getName() != null) user.setName(userDto.getName());

        if (userDto.getEmail() != null && !userDto.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(userDto.getEmail())) {
                throw new RuntimeException("Email already taken");
            }
            user.setEmail(userDto.getEmail());
        }

        // ✅ FIX: Handle password update - store original and encode
        if (userDto.getPassword() != null && !userDto.getPassword().isEmpty()) {
            String originalPassword = userDto.getPassword();
            user.setTempPassword(originalPassword); // Store original
            user.setPassword(passwordEncoder.encode(originalPassword)); // Store encoded
        }

        if (userDto.getRole() != null) {
            try {
                user.setRole(User.Role.valueOf(userDto.getRole().toUpperCase()));
            } catch (Exception ignored) {}
        }

        if (userDto.getStudentId() != null) user.setStudentId(userDto.getStudentId());
        if (userDto.getPhone() != null) user.setPhone(userDto.getPhone());
        if (userDto.getQualification() != null) user.setQualification(userDto.getQualification());
        if (userDto.getSubject() != null) user.setSubject(userDto.getSubject());

        if (userDto.getStatus() != null) {
            try {
                user.setStatus(User.UserStatus.valueOf(userDto.getStatus().toUpperCase()));
            } catch (Exception ignored) {}
        }

        user.setUpdatedAt(LocalDateTime.now());
        User updated = userRepository.save(user);
        return convertToDtoWithOriginalPassword(updated);
    }

    // ✅ FIXED: For existing users without tempPassword, set default
    private UserDto ensureTempPasswordExists(User user) {
        // If tempPassword is null, set a default value for existing users
        if (user.getTempPassword() == null) {
            user.setTempPassword("default123"); // Set default for existing users
            user = userRepository.save(user);
        }
        return convertToDtoWithOriginalPassword(user);
    }

    public UserDto createTeacher(UserDto userDto) {
        return createUserWithRole(userDto, User.Role.TEACHER);
    }

    public UserDto createAdmin(UserDto userDto) {
        return createUserWithRole(userDto, User.Role.ADMIN);
    }

    public UserDto createStudent(UserDto userDto) {
        return createUserWithRole(userDto, User.Role.STUDENT);
    }

    // Delete user
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
    }

    // Update status only
    public UserDto updateUserStatus(Long id, String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus(User.UserStatus.valueOf(status.toUpperCase()));
        user.setUpdatedAt(LocalDateTime.now());
        return convertToDto(userRepository.save(user));
    }

    // Dashboard stats
    public Map<String, Object> getAdminDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalStudents", userRepository.countByRole(User.Role.STUDENT));
        stats.put("totalTeachers", userRepository.countByRole(User.Role.TEACHER));
        stats.put("totalAdmins", userRepository.countByRole(User.Role.ADMIN));
        stats.put("totalUsers", userRepository.count());
        stats.put("activeUsers", userRepository.countByStatus(User.UserStatus.ACTIVE));
        stats.put("inactiveUsers", userRepository.countByStatus(User.UserStatus.INACTIVE));
        stats.put("suspendedUsers", userRepository.countByStatus(User.UserStatus.SUSPENDED));
        return stats;
    }

    public Map<String, Object> getUserStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("students", userRepository.countByRole(User.Role.STUDENT));
        stats.put("teachers", userRepository.countByRole(User.Role.TEACHER));
        stats.put("admins", userRepository.countByRole(User.Role.ADMIN));
        stats.put("active", userRepository.countByStatus(User.UserStatus.ACTIVE));
        stats.put("recent", userRepository.findRecentUsers().stream()
                .limit(5).map(this::convertToDto).collect(Collectors.toList()));
        return stats;
    }

    // Utility
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public boolean existsByStudentId(String studentId) {
        return userRepository.existsByStudentId(studentId);
    }
}
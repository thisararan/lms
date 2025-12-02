// src/main/java/com/lms/dto/UserDto.java
package com.lms.dto;

import com.lms.entity.User;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private String password; // ✅ This will now contain ORIGINAL password for admin
    private String role;
    private String studentId;
    private String subject;
    private String qualification;
    private String phone;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ✅ Static factory method to convert Entity to DTO (without password - for security)
    public static UserDto fromEntity(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        // Don't set password for security in normal cases
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

    // ✅ Static factory method to convert Entity to DTO (with ORIGINAL password - for admin use)
    public static UserDto fromEntityWithOriginalPassword(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPassword(user.getTempPassword()); // ✅ Return ORIGINAL password
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

    // ✅ Convert DTO to Entity for saving
    public User toEntity() {
        User user = new User();
        user.setId(this.id);
        user.setName(this.name);
        user.setEmail(this.email);
        // Password will be handled in service with encoding
        user.setRole(User.Role.valueOf(this.role != null ? this.role : "STUDENT"));
        user.setStudentId(this.studentId);
        user.setSubject(this.subject);
        user.setQualification(this.qualification);
        user.setPhone(this.phone);
        user.setStatus(User.UserStatus.valueOf(this.status != null ? this.status : "ACTIVE"));
        user.setCreatedAt(this.createdAt);
        user.setUpdatedAt(this.updatedAt);
        return user;
    }
}
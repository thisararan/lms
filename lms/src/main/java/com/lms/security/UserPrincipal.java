package com.lms.security;

import com.lms.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Data
@AllArgsConstructor
public class UserPrincipal implements UserDetails {
    private Long id;
    private String name;
    private String email;
    private String password;
    private String role;
    private String studentId;
    private String phone;
    private String qualification;
    private String subject;
    private User.UserStatus status;
    private Collection<? extends GrantedAuthority> authorities;

    public static UserPrincipal create(User user) {
        // Ensure role name starts with ROLE_ for Spring Security
        String roleName = user.getRole().name();
        if (!roleName.startsWith("ROLE_")) {
            roleName = "ROLE_" + roleName;
        }

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority(roleName)
        );

        return new UserPrincipal(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPassword(),
                user.getRole().name(),
                user.getStudentId(),
                user.getPhone(),
                user.getQualification(),
                user.getSubject(),
                user.getStatus(),
                authorities
        );
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return status != User.UserStatus.SUSPENDED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return status == User.UserStatus.ACTIVE;
    }

    // Helper methods to easily access user properties
    public boolean isStudent() {
        return "STUDENT".equals(this.role) || "ROLE_STUDENT".equals(this.role);
    }

    public boolean isTeacher() {
        return "TEACHER".equals(this.role) || "ROLE_TEACHER".equals(this.role);
    }

    public boolean isAdmin() {
        return "ADMIN".equals(this.role) || "ROLE_ADMIN".equals(this.role);
    }

    // Get role without ROLE_ prefix
    public String getSimpleRole() {
        return this.role.replace("ROLE_", "");
    }
}
package com.lms.service;

import com.lms.dto.*;
import com.lms.entity.User;
import com.lms.repository.UserRepository;
import com.lms.security.JwtUtils;
import com.lms.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public JwtResponse login(LoginRequest loginRequest) {
        try {
            System.out.println("🔐 Authenticating user: " + loginRequest.getEmail());

            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Get the UserPrincipal from authentication
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            // Generate JWT token using email
            String jwt = jwtUtils.generateJwtToken(userPrincipal.getEmail());

            // Get user entity for UserDto
            User user = userRepository.findByEmail(userPrincipal.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found after authentication"));

            UserDto userDto = convertToDto(user);

            System.out.println("✅ Login successful for: " + user.getEmail());
            return new JwtResponse(jwt, userDto);

        } catch (Exception e) {
            System.err.println("❌ Authentication failed: " + e.getMessage());
            throw new RuntimeException("Login failed: Invalid email or password");
        }
    }

    public JwtResponse register(RegisterRequest registerRequest) {
        try {
            System.out.println("👤 Registering user: " + registerRequest.getEmail());

            // Check if user already exists
            if (userRepository.existsByEmail(registerRequest.getEmail())) {
                throw new RuntimeException("Email is already registered");
            }

            // Create new user
            User user = new User();
            user.setName(registerRequest.getName());
            user.setEmail(registerRequest.getEmail());
            user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
            user.setStudentId(registerRequest.getStudentId());
            user.setPhone(registerRequest.getPhone());
            user.setQualification(registerRequest.getQualification());
            user.setSubject(registerRequest.getSubject());

            // Set role - handle string to enum conversion
            if (registerRequest.getRole() != null) {
                try {
                    user.setRole(User.Role.valueOf(registerRequest.getRole().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    user.setRole(User.Role.STUDENT); // Default to STUDENT
                }
            } else {
                user.setRole(User.Role.STUDENT); // Default to STUDENT
            }

            user.setStatus(User.UserStatus.ACTIVE);
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());

            User savedUser = userRepository.save(user);
            UserDto userDto = convertToDto(savedUser);

            // Generate token for auto-login after registration
            String jwt = jwtUtils.generateJwtToken(savedUser.getEmail());

            System.out.println("✅ Registration successful for: " + savedUser.getEmail());
            return new JwtResponse(jwt, userDto);

        } catch (Exception e) {
            System.err.println("❌ Registration failed: " + e.getMessage());
            throw new RuntimeException("Registration failed: " + e.getMessage());
        }
    }

    public UserDto getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        // Get UserPrincipal from authentication
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findByEmail(userPrincipal.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return convertToDto(user);
    }

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

    private UserDto convertToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        // Don't set password for security
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
}
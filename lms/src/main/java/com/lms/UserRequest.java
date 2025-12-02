// src/main/java/com/lms/UserRequest.java

package com.lms;

import lombok.Data;

public class UserRequest {

    @Data
    public static class CreateUserRequest {
        private String name;
        private String email;
        private String password;
        private String studentId;
        private String phone;
    }

    @Data
    public static class UpdateUserRequest {
        private String name;
        private String email;
        private String password; // optional
        private String studentId;
        private String phone;
        private String status; // ACTIVE, INACTIVE, SUSPENDED
    }
}
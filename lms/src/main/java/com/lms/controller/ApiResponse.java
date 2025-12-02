package com.lms.controller;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
class ApiResponse {
    private boolean success;
    private String message;

    public ApiResponse(boolean success) {
        this.success = success;
    }
}
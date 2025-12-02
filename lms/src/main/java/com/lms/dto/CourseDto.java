package com.lms.dto;

import lombok.Data;

@Data
public class CourseDto {
    private Long id;
    private String title;
    private String description;
    private String category;
    private String level;
    private String duration;
    private Double price; // Keep as Double for frontend, convert to String in service
    private Long instructorId;
    private String instructorName;
    private Integer students;
    private Double rating;
    private String imageUrl;
}
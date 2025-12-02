package com.lms.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "courses")
@Data
@NoArgsConstructor
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "category", nullable = false)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(name = "level", nullable = false)
    private Level level = Level.BEGINNER;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", nullable = false)
    private User instructor;

    @Column(name = "duration", nullable = false)
    private String duration;

    @Column(name = "students")
    private Integer students = 0;

    @Column(name = "rating")
    private Double rating = 0.0;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "price")
    private String price = "Free";

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Enrollment> enrollments = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Assignment> assignments = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Course(String title, String description, String category, Level level, User instructor, String duration) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.level = level;
        this.instructor = instructor;
        this.duration = duration;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public enum Level {
        BEGINNER, INTERMEDIATE, ADVANCED;

        // Helper method to get display name
        public String getDisplayName() {
            return this.name().charAt(0) + this.name().substring(1).toLowerCase();
        }
    }

    // Helper method to get level display name
    public String getLevelDisplayName() {
        return level.getDisplayName();
    }

    // Helper method to check if course is free
    public boolean isFree() {
        return "Free".equalsIgnoreCase(price) || price == null || price.isEmpty();
    }

    // Helper method to get student count display
    public String getStudentCountDisplay() {
        if (students == null || students == 0) {
            return "No students";
        } else if (students == 1) {
            return "1 student";
        } else {
            return students + " students";
        }
    }

    // Helper method to get rating display
    public String getRatingDisplay() {
        if (rating == null || rating == 0.0) {
            return "No ratings";
        } else {
            return String.format("%.1f ⭐", rating);
        }
    }
}
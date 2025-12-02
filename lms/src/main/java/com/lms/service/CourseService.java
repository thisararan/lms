package com.lms.service;

import com.lms.dto.CourseDto;
import com.lms.entity.Course;
import com.lms.entity.User;
import com.lms.repository.CourseRepository;
import com.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    // Custom exceptions defined as inner classes
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public static class ResourceNotFoundException extends RuntimeException {
        public ResourceNotFoundException(String message) {
            super(message);
        }
    }

    @ResponseStatus(HttpStatus.FORBIDDEN)
    public static class UnauthorizedException extends RuntimeException {
        public UnauthorizedException(String message) {
            super(message);
        }
    }

    // Helper method to convert String to Course.Level enum
    private Course.Level getLevelFromString(String levelStr) {
        if (levelStr == null) {
            return Course.Level.BEGINNER; // Default level
        }
        try {
            return Course.Level.valueOf(levelStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return Course.Level.BEGINNER; // Fallback to beginner
        }
    }

    // Helper method to format price as String
    private String formatPrice(Double price) {
        if (price == null || price == 0.0) {
            return "Free";
        }
        return String.format("$%.2f", price);
    }

    // Helper method to parse price from String to Double
    private Double parsePrice(String priceStr) {
        if (priceStr == null || priceStr.equalsIgnoreCase("free")) {
            return 0.0;
        }
        try {
            // Remove currency symbols and parse
            String cleanPrice = priceStr.replace("$", "").replace(",", "").trim();
            return Double.parseDouble(cleanPrice);
        } catch (NumberFormatException e) {
            return 0.0; // Default to free if parsing fails
        }
    }

    // Existing method - for teachers creating their own courses
    public CourseDto createCourse(CourseDto courseDto, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check if user is a teacher
        if (!user.getRole().name().equals("TEACHER")) {
            throw new UnauthorizedException("Only teachers can create courses");
        }

        Course course = new Course();
        course.setTitle(courseDto.getTitle());
        course.setDescription(courseDto.getDescription());
        course.setCategory(courseDto.getCategory());
        course.setLevel(getLevelFromString(courseDto.getLevel()));
        course.setDuration(courseDto.getDuration());
        course.setPrice(formatPrice(courseDto.getPrice())); // Convert Double to String
        course.setInstructor(user); // Teacher becomes the instructor

        Course savedCourse = courseRepository.save(course);
        return mapToDto(savedCourse);
    }

    // NEW METHOD: Admin course creation
    public CourseDto createCourseAsAdmin(CourseDto courseDto, Long adminId) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check if user is an admin
        if (!admin.getRole().name().equals("ADMIN")) {
            throw new UnauthorizedException("Only administrators can use this endpoint");
        }

        Course course = new Course();
        course.setTitle(courseDto.getTitle());
        course.setDescription(courseDto.getDescription());
        course.setCategory(courseDto.getCategory());
        course.setLevel(getLevelFromString(courseDto.getLevel()));
        course.setDuration(courseDto.getDuration());
        course.setPrice(formatPrice(courseDto.getPrice())); // Convert Double to String

        // Admin can assign any instructor or leave it null
        if (courseDto.getInstructorId() != null) {
            User instructor = userRepository.findById(courseDto.getInstructorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));

            // Verify the assigned user is actually a teacher
            if (!instructor.getRole().name().equals("TEACHER")) {
                throw new IllegalArgumentException("Assigned user must be a teacher");
            }
            course.setInstructor(instructor);
        } else {
            // For admin-created courses without instructor, we need to handle this
            // Since instructor is nullable=false in entity, we need to assign a default or handle differently
            throw new IllegalArgumentException("Admin must assign a teacher to the course");
        }

        Course savedCourse = courseRepository.save(course);
        return mapToDto(savedCourse);
    }

    // Alternative: Universal course creation method (recommended)
    public CourseDto createCourseUniversal(CourseDto courseDto, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Course course = new Course();
        course.setTitle(courseDto.getTitle());
        course.setDescription(courseDto.getDescription());
        course.setCategory(courseDto.getCategory());
        course.setLevel(getLevelFromString(courseDto.getLevel()));
        course.setDuration(courseDto.getDuration());
        course.setPrice(formatPrice(courseDto.getPrice())); // Convert Double to String

        // Role-based logic
        if (user.getRole().name().equals("ADMIN")) {
            // Admin can assign any instructor
            if (courseDto.getInstructorId() != null) {
                User instructor = userRepository.findById(courseDto.getInstructorId())
                        .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));

                if (!instructor.getRole().name().equals("TEACHER")) {
                    throw new IllegalArgumentException("Assigned user must be a teacher");
                }
                course.setInstructor(instructor);
            } else {
                throw new IllegalArgumentException("Admin must assign a teacher to the course");
            }
        } else if (user.getRole().name().equals("TEACHER")) {
            // Teacher automatically becomes the instructor
            course.setInstructor(user);
        } else {
            throw new UnauthorizedException("Only teachers and administrators can create courses");
        }

        Course savedCourse = courseRepository.save(course);
        return mapToDto(savedCourse);
    }

    // Keep your existing methods...
    public List<CourseDto> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public CourseDto getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        return mapToDto(course);
    }

    public CourseDto updateCourse(Long id, CourseDto courseDto) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        course.setTitle(courseDto.getTitle());
        course.setDescription(courseDto.getDescription());
        course.setCategory(courseDto.getCategory());
        course.setLevel(getLevelFromString(courseDto.getLevel()));
        course.setDuration(courseDto.getDuration());
        course.setPrice(formatPrice(courseDto.getPrice())); // Convert Double to String

        // Update instructor if provided
        if (courseDto.getInstructorId() != null) {
            User instructor = userRepository.findById(courseDto.getInstructorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));
            course.setInstructor(instructor);
        }

        Course updatedCourse = courseRepository.save(course);
        return mapToDto(updatedCourse);
    }

    public void deleteCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        courseRepository.delete(course);
    }

    // FIXED: Use the correct repository method name
    public List<CourseDto> searchCourses(String query) {
        return courseRepository.searchCourses(query)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<CourseDto> getCoursesByCategory(String category) {
        return courseRepository.findByCategory(category)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private CourseDto mapToDto(Course course) {
        CourseDto dto = new CourseDto();
        dto.setId(course.getId());
        dto.setTitle(course.getTitle());
        dto.setDescription(course.getDescription());
        dto.setCategory(course.getCategory());
        dto.setLevel(course.getLevel() != null ? course.getLevel().name() : "BEGINNER");
        dto.setDuration(course.getDuration());
        dto.setPrice(parsePrice(course.getPrice())); // Convert String to Double for DTO
        dto.setInstructorId(course.getInstructor() != null ? course.getInstructor().getId() : null);
        dto.setInstructorName(course.getInstructor() != null ? course.getInstructor().getName() : null);
        dto.setStudents(course.getStudents());
        dto.setRating(course.getRating());
        dto.setImageUrl(course.getImageUrl());
        return dto;
    }
}
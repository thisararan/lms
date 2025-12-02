package com.lms.service;

import com.lms.entity.User;
import com.lms.entity.Course;
import com.lms.repository.UserRepository;
import com.lms.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    public Map<String, Object> getAdminDashboard() {
        Map<String, Object> dashboardData = new HashMap<>();

        // Get all users count by role
        List<User> allUsers = userRepository.findAll();
        long totalStudents = allUsers.stream()
                .filter(user -> user.getRole() == User.Role.STUDENT)
                .count();
        long totalTeachers = allUsers.stream()
                .filter(user -> user.getRole() == User.Role.TEACHER)
                .count();
        long totalAdmins = allUsers.stream()
                .filter(user -> user.getRole() == User.Role.ADMIN)
                .count();

        // Get courses count
        long totalCourses = courseRepository.count();

        // Get recent students (last 5)
        List<User> recentStudents = userRepository.findByRole(User.Role.STUDENT)
                .stream()
                .limit(5)
                .collect(Collectors.toList());

        dashboardData.put("totalUsers", allUsers.size());
        dashboardData.put("totalStudents", totalStudents);
        dashboardData.put("totalTeachers", totalTeachers);
        dashboardData.put("totalAdmins", totalAdmins);
        dashboardData.put("totalCourses", totalCourses);
        dashboardData.put("users", allUsers);
        dashboardData.put("recentStudents", recentStudents);
        dashboardData.put("message", "Dashboard data loaded successfully");

        return dashboardData;
    }

    public Map<String, Object> getTeacherDashboard(Long teacherId) {
        Map<String, Object> dashboardData = new HashMap<>();

        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        // Get courses taught by this teacher
        List<Course> teacherCourses = courseRepository.findByInstructor(teacher);

        // Calculate total students across all courses
        long totalStudents = teacherCourses.stream()
                .mapToLong(course -> course.getStudents() != null ? course.getStudents() : 0)
                .sum();

        Map<String, Object> teacherInfo = new HashMap<>();
        teacherInfo.put("id", teacher.getId());
        teacherInfo.put("name", teacher.getName());
        teacherInfo.put("email", teacher.getEmail());
        teacherInfo.put("subject", teacher.getSubject());
        teacherInfo.put("qualification", teacher.getQualification());
        teacherInfo.put("phone", teacher.getPhone());

        dashboardData.put("teacher", teacherInfo);
        dashboardData.put("coursesCount", teacherCourses.size());
        dashboardData.put("studentsCount", totalStudents);
        dashboardData.put("courses", teacherCourses.stream()
                .map(course -> {
                    Map<String, Object> courseMap = new HashMap<>();
                    courseMap.put("id", course.getId());
                    courseMap.put("title", course.getTitle());
                    courseMap.put("description", course.getDescription());
                    courseMap.put("category", course.getCategory());
                    courseMap.put("level", course.getLevel().toString());
                    courseMap.put("students", course.getStudents() != null ? course.getStudents() : 0);
                    courseMap.put("rating", course.getRating() != null ? course.getRating() : 0.0);
                    courseMap.put("duration", course.getDuration());
                    courseMap.put("price", course.getPrice());
                    return courseMap;
                })
                .collect(Collectors.toList()));
        dashboardData.put("message", "Teacher dashboard loaded successfully");

        return dashboardData;
    }
}
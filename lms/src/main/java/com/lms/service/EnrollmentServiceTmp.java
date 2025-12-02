package com.lms.service;

import java.util.List;

public interface EnrollmentServiceTmp {
    List<Long> getEnrolledCourseIds(Long studentId);
}
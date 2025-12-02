// src/main/java/com/lms/repository/SubmissionRepository.java

package com.lms.repository;

import com.lms.entity.Submission;
import com.lms.entity.Assignment;
import com.lms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    // Find all submissions for a specific assignment
    List<Submission> findByAssignment(Assignment assignment);

    // Find all submissions by a student
    List<Submission> findByStudent(User student);

    // Find one submission by assignment + student (for update/resubmit)
    Optional<Submission> findByAssignmentAndStudent(Assignment assignment, User student);

    // DIRECT: Find submissions by assignment ID (MOST IMPORTANT FOR TEACHER VIEW)
    List<Submission> findByAssignmentId(Long assignmentId);

    // Find submissions by student ID
    List<Submission> findByStudentId(Long studentId);

    // Count total submissions for an assignment
    long countByAssignmentId(Long assignmentId);

    // Count graded submissions
    long countByGraded(boolean graded);

    // TEACHER: Get all submissions from all their courses (joins through Assignment → Course → Instructor)
    @Query("SELECT s FROM Submission s " +
            "WHERE s.assignment.course.instructor.id = :instructorId")
    List<Submission> findByAssignment_Course_Instructor_Id(@Param("instructorId") Long instructorId);
}
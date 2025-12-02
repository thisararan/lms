package com.lms.repository;

import com.lms.entity.Note;
import com.lms.entity.User;
import com.lms.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByAuthor(User author);

    List<Note> findByCourse(Course course);

    List<Note> findByVisibility(Note.Visibility visibility);

    @Query("SELECT n FROM Note n WHERE n.course IS NULL AND n.visibility = 'ALL'")
    List<Note> findGeneralNotes();

    @Query("SELECT n FROM Note n WHERE " +
            "(n.course IS NULL AND n.visibility = 'ALL') OR " +
            "(n.course.id IN :courseIds AND n.visibility = 'COURSE')")
    List<Note> findAccessibleNotes(@Param("courseIds") List<Long> courseIds);

    List<Note> findByCourseId(Long courseId);
}
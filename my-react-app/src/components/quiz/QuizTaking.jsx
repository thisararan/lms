import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Form, ProgressBar, Alert } from 'react-bootstrap';
import { quizzesAPI } from '../../services/api';

const QuizTaking = ({ quizId }) => {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    if (quiz && quiz.timeLimit && !submitted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz, submitted]);

  const loadQuiz = async () => {
    try {
      const response = await quizzesAPI.getById(quizId);
      const quizData = response.data;
      setQuiz(quizData);
      setTimeLeft(quizData.timeLimit * 60); // Convert to seconds
    } catch (error) {
      console.error('Error loading quiz:', error);
    }
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await quizzesAPI.takeQuiz(quizId, { answers });
      setScore(response.data);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!quiz) return <div>Loading quiz...</div>;

  if (submitted && score) {
    return (
      <Container className="my-4">
        <Card>
          <Card.Body className="text-center">
            <h3>Quiz Submitted!</h3>
            <div className="my-4">
              <h1 className={score.passed ? 'text-success' : 'text-danger'}>
                {score.score}%
              </h1>
              <p>
                You scored {score.correctAnswers} out of {score.totalQuestions} questions correctly.
              </p>
              {score.passed ? (
                <Alert variant="success">Congratulations! You passed the quiz.</Alert>
              ) : (
                <Alert variant="danger">You didn't pass the quiz. Please try again.</Alert>
              )}
            </div>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Take Another Quiz
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <Container className="my-4">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">{quiz.title}</h4>
          {quiz.timeLimit && (
            <div className={`fs-5 ${timeLeft < 300 ? 'text-danger' : 'text-dark'}`}>
              Time Left: {formatTime(timeLeft)}
            </div>
          )}
        </Card.Header>
        
        <Card.Body>
          {/* Progress Bar */}
          <ProgressBar 
            now={progress} 
            label={`${currentQuestion + 1}/${quiz.questions.length}`}
            className="mb-4"
          />

          {/* Question */}
          <div className="mb-4">
            <h5>Question {currentQuestion + 1}</h5>
            <p className="fs-6">{question.text}</p>
            
            {question.type === 'MULTIPLE_CHOICE' && (
              <div>
                {question.options.map((option, index) => (
                  <Form.Check
                    key={index}
                    type="radio"
                    id={`option-${index}`}
                    name={`question-${question.id}`}
                    label={option}
                    checked={answers[question.id] === index}
                    onChange={() => handleAnswer(question.id, index)}
                    className="mb-2"
                  />
                ))}
              </div>
            )}

            {question.type === 'TRUE_FALSE' && (
              <div>
                <Form.Check
                  type="radio"
                  id="true"
                  name={`question-${question.id}`}
                  label="True"
                  checked={answers[question.id] === true}
                  onChange={() => handleAnswer(question.id, true)}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  id="false"
                  name={`question-${question.id}`}
                  label="False"
                  checked={answers[question.id] === false}
                  onChange={() => handleAnswer(question.id, false)}
                  className="mb-2"
                />
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="d-flex justify-content-between">
            <Button
              variant="outline-primary"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            
            {currentQuestion === quiz.questions.length - 1 ? (
              <Button variant="success" onClick={handleSubmit}>
                Submit Quiz
              </Button>
            ) : (
              <Button variant="primary" onClick={handleNext}>
                Next
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default QuizTaking;
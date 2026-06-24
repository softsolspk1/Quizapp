import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

const QuizScreen = ({ navigation, route }) => {
  const { category, questions, gameMode, competitionId } = route.params;
  const { user } = useAuth();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const timerAnimation = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  useEffect(() => {
    if (quizStarted && !quizCompleted) {
      startTimer();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quizStarted, currentQuestionIndex, quizCompleted]);

  const startTimer = () => {
    setTimeLeft(30);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Reset timer animation
    timerAnimation.setValue(1);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAnswerSubmit(null, true); // Auto-submit when time runs out
          return 0;
        }
        
        // Animate timer based on remaining time
        const progress = (30 - prev + 1) / 30;
        timerAnimation.setValue(1 - progress);
        
        // Add urgency animation when time is low
        if (prev <= 10) {
          Animated.sequence([
            Animated.timing(timerAnimation, {
              toValue: 0.8,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(timerAnimation, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
        
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  const handleAnswerSubmit = (answerIndex = selectedAnswer, isTimeout = false) => {
    if (!isTimeout && answerIndex === null) {
      Alert.alert('Please select an answer', 'You must choose an answer before proceeding.');
      return;
    }

    const answer = {
      questionId: currentQuestion.id,
      answer: answerIndex,
      timeSpent: 30 - timeLeft,
      isTimeout
    };

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (isLastQuestion) {
      submitQuiz(newAnswers);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTimeLeft(30);
    }
  };

  const submitQuiz = async (finalAnswers) => {
    setQuizCompleted(true);
    
    try {
      const response = await axios.post(`${API_URL}/api/quiz/submit`, {
        sessionId,
        answers: finalAnswers,
        competitionId: gameMode === 'competition' ? competitionId : undefined
      });

      navigation.navigate('Results', {
        results: response.data,
        category,
        gameMode,
        answers: finalAnswers,
        questions: questions
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to submit quiz results');
      navigation.goBack();
    }
  };

  const startQuiz = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/quiz/start`, {
        categoryId: category.id,
        totalQuestions: questions.length,
        gameMode
      });
      setSessionId(response.data.sessionId);
      
      setQuizStarted(true);
      Animated.timing(progressAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } catch (error) {
      Alert.alert('Error', 'Failed to start quiz session');
    }
  };

  if (!quizStarted) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#3b82f6', '#1d4ed8']}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.quizTitle}>{category.name} Quiz</Text>
            <Text style={styles.quizSubtitle}>
              {gameMode === 'multiplayer' ? 'Multiplayer Mode' : 'Single Player Mode'}
            </Text>
            <View style={styles.quizInfo}>
              <Text style={styles.quizInfoText}>{questions.length} Questions</Text>
              <Text style={styles.quizInfoText}>30 seconds per question</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.readyCard}>
            <Ionicons name="rocket" size={48} color="#3b82f6" />
            <Text style={styles.readyTitle}>Ready to Start?</Text>
            <Text style={styles.readyDescription}>
              You'll have 30 seconds to answer each question. Good luck!
            </Text>
            
            <TouchableOpacity style={styles.startButton} onPress={startQuiz}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.startButtonGradient}
              >
                <Text style={styles.startButtonText}>Start Quiz</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (quizCompleted) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Calculating your score...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3b82f6', '#1d4ed8']}
        style={styles.header}
      >
        <View style={styles.quizHeader}>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {currentQuestionIndex + 1} / {questions.length}
            </Text>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${((currentQuestionIndex + 1) / questions.length) * 100}%`],
                    }),
                  },
                ]}
              />
            </View>
          </View>
          
          <View style={styles.timerContainer}>
            <Ionicons 
              name="time" 
              size={20} 
              color={timeLeft <= 10 ? "#ef4444" : "white"} 
            />
            <Animated.View style={[
              styles.timerCircle,
              {
                transform: [{ scale: timerAnimation }],
                backgroundColor: timeLeft <= 10 ? "#ef4444" : timeLeft <= 20 ? "#f59e0b" : "#10b981"
              }
            ]}>
              <Text style={[
                styles.timerText,
                { color: timeLeft <= 10 ? "white" : "white" }
              ]}>
                {timeLeft}s
              </Text>
            </Animated.View>
            {timeLeft <= 10 && (
              <Animated.Text style={[
                styles.urgencyText,
                {
                  opacity: timerAnimation,
                  transform: [{ scale: timerAnimation }]
                }
              ]}>
                Hurry!
              </Animated.Text>
            )}
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswer === index && styles.optionButtonSelected
              ]}
              onPress={() => handleAnswerSelect(index)}
            >
              <Text style={styles.optionLabel}>
                {String.fromCharCode(65 + index)}
              </Text>
              <Text style={[
                styles.optionText,
                selectedAnswer === index && styles.optionTextSelected
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.nextButton,
            selectedAnswer === null && styles.nextButtonDisabled
          ]}
          onPress={() => handleAnswerSubmit()}
          disabled={selectedAnswer === null}
        >
          <Text style={styles.nextButtonText}>
            {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    zIndex: 1,
    padding: 8,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  quizTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  quizSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter-Medium',
  },
  quizInfo: {
    flexDirection: 'row',
    gap: 20,
  },
  quizInfoText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  readyCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  readyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  readyDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  startButton: {
    width: '100%',
  },
  startButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  progressContainer: {
    flex: 1,
  },
  progressText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  urgencyText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginLeft: 4,
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionText: {
    fontSize: 18,
    color: '#1f2937',
    lineHeight: 26,
    fontFamily: 'Inter-Medium',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionButtonSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 32,
    marginRight: 16,
    fontFamily: 'Inter-SemiBold',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Inter-Regular',
  },
  optionTextSelected: {
    color: '#1f2937',
    fontFamily: 'Inter-Medium',
  },
  nextButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6b7280',
    fontFamily: 'Inter-Medium',
  },
});

export default QuizScreen;



import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
  
  const progressAnimation = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  useEffect(() => {
    if (quizStarted && !quizCompleted) {
      startTimer();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizStarted, currentQuestionIndex, quizCompleted]);

  const startTimer = () => {
    setTimeLeft(30);
    if (timerRef.current) clearInterval(timerRef.current);
    progressAnimation.setValue(1);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAnswerSubmit(null, true);
          return 0;
        }
        const progress = (prev - 1) / 30;
        Animated.timing(progressAnimation, {
          toValue: progress,
          duration: 1000,
          useNativeDriver: true,
        }).start();
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswerSelect = (answerIndex) => {
    if (selectedAnswer !== null) return; // Prevent changing answer if we want immediate feedback
    setSelectedAnswer(answerIndex);
    // In a real app we might wait 1 sec then auto next, but user requested 'Next' button
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
      progressAnimation.setValue(1);
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
      navigation.replace('Results', {
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
    } catch (error) {
      Alert.alert('Error', 'Failed to start quiz session');
    }
  };

  if (!quizStarted) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#6d28d9', '#4c1d95']} style={styles.headerStart}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.quizTitle}>{category.name} Quiz</Text>
            <Text style={styles.quizSubtitle}>{gameMode === 'multiplayer' ? 'Multiplayer' : 'Single Player'}</Text>
          </View>
        </LinearGradient>
        <View style={styles.contentStart}>
          <View style={styles.readyCard}>
            <Ionicons name="rocket" size={48} color="#6d28d9" />
            <Text style={styles.readyTitle}>Ready to Start?</Text>
            <Text style={styles.readyDescription}>You'll have 30 seconds to answer each question.</Text>
            <TouchableOpacity style={styles.startButton} onPress={startQuiz}>
              <LinearGradient colors={['#f97316', '#ea580c']} style={styles.startButtonGradient}>
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

  // Timer SVG settings
  const circleRadius = 30;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [circleCircumference, 0]
  });

  return (
    <View style={styles.container}>
      {/* Background Header */}
      <View style={styles.headerBg}>
        <View style={styles.headerTopBar}>
          <View style={styles.headerPill}>
            <Ionicons name="person-outline" size={16} color="#1f2937" />
            <Text style={styles.headerPillText}>{currentQuestionIndex + 1} of {questions.length}</Text>
          </View>
          <View style={styles.progressBarBg}>
             <View style={[styles.progressBarFill, { width: `${((currentQuestionIndex + 1)/questions.length)*100}%` }]} />
          </View>
          <View style={styles.headerPillOrange}>
            <Ionicons name="extension-puzzle-outline" size={16} color="white" />
            <Text style={styles.headerPillTextOrange}>1 of 10</Text>
          </View>
        </View>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.cardContainer}>
          
          {/* Circular Timer overlaps card */}
          <View style={styles.timerWrapper}>
            <View style={styles.timerBackground}>
              <Svg width="70" height="70" viewBox="0 0 70 70">
                <Circle cx="35" cy="35" r={circleRadius} stroke="#f3f4f6" strokeWidth="4" fill="none" />
                <AnimatedCircle
                  cx="35" cy="35" r={circleRadius}
                  stroke="#f97316" strokeWidth="4" fill="none"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  rotation="-90"
                  origin="35, 35"
                />
              </Svg>
              <View style={styles.timerTextContainer}>
                <Text style={styles.timerTextValue}>{timeLeft}</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardInternal}>
            <View style={styles.hintBtn}>
              <Ionicons name="bulb" size={14} color="#f97316" />
              <Text style={styles.hintText}>Hint</Text>
            </View>

            <Text style={styles.questionIndexText}>Question <Text style={styles.questionIndexNumber}>0{currentQuestionIndex + 1}</Text></Text>
            <Text style={styles.categoryText}>{category.name} Quiz</Text>
            
            <View style={styles.divider} />

            <Text style={styles.questionText}>"{currentQuestion.question}"</Text>
          </View>
        </View>

        <View style={styles.optionsList}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            // Simplified feedback: if selected, just style it. 
            // We aren't showing correct/incorrect immediately until they submit or we can do it instantly.
            // If they want immediate feedback, we need to know the correct answer. We only have it if sent from server.
            // Assuming we don't have correctAnswer here, so we just highlight selection.
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  isSelected && styles.optionButtonSelected
                ]}
                onPress={() => handleAnswerSelect(index)}
                disabled={selectedAnswer !== null}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option}</Text>
                
                <View style={[styles.optionRadio, isSelected && styles.optionRadioSelected]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, selectedAnswer === null && styles.nextButtonDisabled]}
          onPress={() => handleAnswerSubmit()}
          disabled={selectedAnswer === null}
        >
          <Text style={styles.nextButtonText}>{isLastQuestion ? 'Finish' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  headerStart: { paddingTop: 60, paddingBottom: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  headerContent: { alignItems: 'center', marginTop: 20 },
  quizTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', fontFamily: 'Inter-Bold', marginBottom: 8 },
  quizSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter-Medium' },
  contentStart: { flex: 1, padding: 20, marginTop: -30 },
  readyCard: { backgroundColor: 'white', borderRadius: 24, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  readyTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginTop: 16, marginBottom: 8, fontFamily: 'Inter-Bold' },
  readyDescription: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 30, fontFamily: 'Inter-Regular' },
  startButton: { width: '100%' },
  startButtonGradient: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  startButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', fontFamily: 'Inter-Bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: '#6b7280', fontFamily: 'Inter-Medium' },

  // Live Quiz Styles
  headerBg: {
    backgroundColor: '#6d28d9',
    height: 250,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingTop: 60,
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0, left: 0, right: 0
  },
  headerTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  headerPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20
  },
  headerPillText: { marginLeft: 6, fontSize: 13, fontWeight: 'bold', color: '#1f2937' },
  progressBarBg: {
    flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 12, borderRadius: 3
  },
  progressBarFill: { height: '100%', backgroundColor: '#f97316', borderRadius: 3 },
  headerPillOrange: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f97316',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20
  },
  headerPillTextOrange: { marginLeft: 6, fontSize: 13, fontWeight: 'bold', color: 'white' },

  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 120,
  },
  cardContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerWrapper: {
    position: 'absolute',
    top: -35,
    zIndex: 10,
    backgroundColor: '#6d28d9',
    borderRadius: 40,
    padding: 5,
  },
  timerBackground: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center'
  },
  timerTextContainer: { position: 'absolute' },
  timerTextValue: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', fontFamily: 'Inter-Bold' },
  
  cardInternal: {
    backgroundColor: 'white',
    width: '100%',
    borderRadius: 24,
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 30,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
  },
  hintBtn: {
    position: 'absolute', top: 20, left: 20,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ffedd5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12
  },
  hintText: { marginLeft: 4, fontSize: 12, color: '#f97316', fontWeight: 'bold' },
  questionIndexText: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', fontFamily: 'Inter-Bold' },
  questionIndexNumber: { color: '#6d28d9' },
  categoryText: { fontSize: 14, color: '#6b7280', marginTop: 8, fontFamily: 'Inter-Medium' },
  divider: { width: '80%', height: 1, backgroundColor: '#e5e7eb', marginVertical: 20, borderStyle: 'dashed' },
  questionText: { fontSize: 18, color: '#1f2937', textAlign: 'center', lineHeight: 28, fontFamily: 'Inter-SemiBold' },

  optionsList: { flex: 1 },
  optionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  optionButtonSelected: {
    borderColor: '#22c55e', backgroundColor: '#f0fdf4'
  },
  optionText: { fontSize: 16, color: '#4b5563', fontFamily: 'Inter-Medium', flex: 1 },
  optionTextSelected: { color: '#166534', fontWeight: 'bold' },
  optionRadio: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#d1d5db',
    alignItems: 'center', justifyContent: 'center'
  },
  optionRadioSelected: {
    backgroundColor: '#22c55e', borderColor: '#22c55e'
  },
  
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  nextButton: {
    backgroundColor: '#6d28d9',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#6d28d9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6
  },
  nextButtonDisabled: {
    backgroundColor: '#d1d5db', shadowOpacity: 0
  },
  nextButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', fontFamily: 'Inter-Bold' }
});

export default QuizScreen;

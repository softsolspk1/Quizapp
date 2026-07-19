import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const ResultsScreen = ({ navigation, route }) => {
  const { results, category, gameMode, answers, questions } = route.params;
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  
  const accuracy = ((results.correctAnswers / results.totalQuestions) * 100).toFixed(1);
  const unattempted = results.totalQuestions - results.correctAnswers - results.wrongAnswers;

  const getWrongAnswers = () => {
    if (!questions || !answers) return [];
    return questions.map((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer && userAnswer.answer === question.correctAnswer;
      if (!isCorrect) {
        return {
          question: question.question,
          userAnswer: userAnswer && userAnswer.answer !== null ? question.options[userAnswer.answer] : 'No answer',
          correctAnswer: question.options[question.correctAnswer],
          explanation: question.explanation || 'No explanation available',
          questionNumber: index + 1
        };
      }
      return null;
    }).filter(Boolean);
  };

  const wrongAnswers = getWrongAnswers();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just achieved a score of ${results.score} on the ${category.name} Quiz in the Hilton Quiz App! Can you beat my score?`,
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Result Summary</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.rankSection}>
          <View style={styles.trophyCircle}>
            <Ionicons name="trophy" size={32} color="#facc15" />
          </View>
          <View style={styles.rankTextContainer}>
            <Text style={styles.rankHighlight}>{results.score}</Text>
            <Text style={styles.rankLabel}>Your Score</Text>
          </View>
          <View style={styles.completePill}>
            <Text style={styles.completeText}>Complete</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Main Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.cardHeader}>
            <View style={styles.dayBox}>
               <Text style={styles.dayTextSmall}>DAY</Text>
               <Text style={styles.dayTextLarge}>1</Text>
            </View>
            <View style={styles.challengeInfo}>
               <Text style={styles.challengeTitle}>{category.name} Challenge</Text>
               <Text style={styles.challengeSubtitle}>Mode - {gameMode}</Text>
            </View>
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>TODAY</Text>
            </View>
          </View>

          <View style={styles.marksSection}>
             <Ionicons name="medal" size={48} color="#f59e0b" style={{ marginRight: 15 }} />
             <View style={{ flex: 1 }}>
               <Text style={styles.marksLabel}>Your Score</Text>
               <Text style={styles.marksHighlight}>
                 {results.score} 
                 <Text style={styles.marksTotal}>
                   / {questions.reduce((acc, q) => {
                     const diff = q.difficulty || 'medium';
                     const val = diff === 'easy' ? 2 : diff === 'hard' ? 5 : 3;
                     return acc + val;
                   }, 0)}
                 </Text>
               </Text>
             </View>
             <TouchableOpacity style={styles.analysisPill} onPress={() => setShowDetailedResults(!showDetailedResults)}>
               <Text style={styles.analysisText}>Analysis</Text>
             </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>Max Points</Text>
              <Text style={styles.statBoxValue}>{results.totalQuestions * 10}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>Points Scored</Text>
              <Text style={[styles.statBoxValue, { color: '#6d28d9' }]}>{results.score}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>Accuracy</Text>
              <Text style={[styles.statBoxValue, { color: '#f97316' }]}>{accuracy}%</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.footerStats}>
            <Ionicons name="extension-puzzle" size={20} color="#8b5cf6" />
            <Text style={styles.footerStatsText}>Trivia Quiz</Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={handleShare} style={{ marginLeft: 15 }}>
              <Ionicons name="share-social-outline" size={20} color="#4b5563" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Detailed Breakdown Card */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={styles.breakdownItem}>
                <Ionicons name="checkmark-circle" size={20} color="#6d28d9" />
                <Text style={styles.breakdownLabel}>Correct Qs :</Text>
                <Text style={styles.breakdownValue}>{results.correctAnswers}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Ionicons name="close-circle" size={20} color="#f97316" />
                <Text style={styles.breakdownLabel}>Wrong Qs :</Text>
                <Text style={styles.breakdownValue}>{results.wrongAnswers}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Ionicons name="radio-button-off" size={20} color="#d1d5db" />
                <Text style={styles.breakdownLabel}>Unattempted Qs :</Text>
                <Text style={styles.breakdownValue}>{unattempted}</Text>
              </View>
              <TouchableOpacity style={styles.viewSolutionBtn} onPress={() => setShowDetailedResults(!showDetailedResults)}>
                <Text style={styles.viewSolutionText}>View Solution</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.breakdownRight}>
               <Ionicons name="trophy" size={40} color="#facc15" style={{ marginBottom: 10 }} />
               <Text style={styles.exploreText}>Explore ongoing contests and join the ones that you like.</Text>
               <TouchableOpacity style={styles.joinNowBtn} onPress={() => navigation.navigate('Home')}>
                 <Text style={styles.joinNowText}>Home</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>

        {showDetailedResults && (
          <View style={styles.detailedResults}>
            <Text style={styles.detailedTitle}>Solutions Review</Text>
            {wrongAnswers.map((wrongAnswer, index) => (
              <View key={index} style={styles.wrongAnswerCard}>
                <Text style={styles.questionNumber}>Question {wrongAnswer.questionNumber}</Text>
                <Text style={styles.wrongQuestionText}>{wrongAnswer.question}</Text>
                
                <View style={styles.answerComparison}>
                  <View style={styles.answerRow}>
                    <Text style={styles.answerLabel}>Your Answer:</Text>
                    <View style={styles.wrongAnswerBox}>
                      <Text style={styles.wrongAnswerText}>{wrongAnswer.userAnswer}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.answerRow}>
                    <Text style={styles.answerLabel}>Correct Answer:</Text>
                    <View style={styles.correctAnswerBox}>
                      <Text style={styles.correctAnswerText}>{wrongAnswer.correctAnswer}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.explanationBox}>
                  <Text style={styles.explanationLabel}>Explanation:</Text>
                  <Text style={styles.explanationText}>{wrongAnswer.explanation}</Text>
                </View>
              </View>
            ))}
            {wrongAnswers.length === 0 && (
              <Text style={{ textAlign: 'center', color: '#16a34a', fontWeight: 'bold' }}>Perfect Score! No wrong answers.</Text>
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  headerBackground: {
    backgroundColor: '#6d28d9',
    paddingTop: 50, paddingHorizontal: 20, paddingBottom: 80,
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, color: 'white', fontWeight: 'bold', fontFamily: 'Inter-Bold' },
  rankSection: { flexDirection: 'row', alignItems: 'center', marginTop: 30 },
  trophyCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  rankTextContainer: { flex: 1 },
  rankHighlight: { fontSize: 28, color: '#f97316', fontWeight: 'bold', fontFamily: 'Inter-Bold' },
  rankLabel: { fontSize: 14, color: 'white', fontFamily: 'Inter-Medium' },
  completePill: { backgroundColor: '#f97316', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  completeText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  
  content: { flex: 1, paddingHorizontal: 20, marginTop: -50 },
  
  statsCard: {
    backgroundColor: 'white', borderRadius: 24, padding: 24, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dayBox: { backgroundColor: '#6d28d9', borderRadius: 12, padding: 10, alignItems: 'center', justifyContent: 'center', marginRight: 15, width: 50, height: 50 },
  dayTextSmall: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  dayTextLarge: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  challengeInfo: { flex: 1 },
  challengeTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', fontFamily: 'Inter-Bold' },
  challengeSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  dateBadge: { backgroundColor: '#4f46e5', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  dateText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  
  marksSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  marksLabel: { fontSize: 14, color: '#6b7280', fontFamily: 'Inter-Medium' },
  marksHighlight: { fontSize: 24, color: '#f97316', fontWeight: 'bold', fontFamily: 'Inter-Bold' },
  marksTotal: { fontSize: 16, color: '#1f2937' },
  analysisPill: { backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  analysisText: { color: '#4b5563', fontSize: 12, fontWeight: 'bold' },
  
  divider: { height: 1, backgroundColor: '#e5e7eb', width: '100%', borderStyle: 'dashed', marginVertical: 15 },
  
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { flex: 1 },
  statBoxLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  statBoxValue: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', fontFamily: 'Inter-Bold' },
  
  footerStats: { flexDirection: 'row', alignItems: 'center' },
  footerStatsText: { marginLeft: 8, fontSize: 14, color: '#4b5563', fontWeight: '600' },
  
  breakdownCard: {
    backgroundColor: 'white', borderRadius: 24, padding: 24, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
  },
  breakdownRow: { flexDirection: 'row' },
  breakdownLeft: { flex: 1, borderRightWidth: 1, borderRightColor: '#e5e7eb', borderStyle: 'dashed', paddingRight: 15 },
  breakdownItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  breakdownLabel: { marginLeft: 8, flex: 1, fontSize: 13, color: '#4b5563' },
  breakdownValue: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  viewSolutionBtn: { backgroundColor: '#ede9fe', borderRadius: 16, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
  viewSolutionText: { color: '#6d28d9', fontWeight: 'bold', fontSize: 12 },
  
  breakdownRight: { flex: 1, paddingLeft: 15, alignItems: 'center' },
  exploreText: { fontSize: 12, color: '#6b7280', textAlign: 'center', marginBottom: 15 },
  joinNowBtn: { backgroundColor: '#6d28d9', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center', width: '100%' },
  joinNowText: { color: 'white', fontWeight: 'bold', fontSize: 12 },

  detailedResults: {
    backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  detailedTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 16, fontFamily: 'Inter-Bold' },
  wrongAnswerCard: { backgroundColor: '#fef2f2', borderRadius: 12, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  questionNumber: { fontSize: 14, fontWeight: '600', color: '#ef4444', marginBottom: 8, fontFamily: 'Inter-SemiBold' },
  wrongQuestionText: { fontSize: 16, color: '#1f2937', marginBottom: 12, fontFamily: 'Inter-Medium' },
  answerComparison: { marginBottom: 12 },
  answerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  answerLabel: { fontSize: 14, fontWeight: '600', color: '#374151', width: 100, fontFamily: 'Inter-SemiBold' },
  wrongAnswerBox: { flex: 1, backgroundColor: '#fecaca', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#fca5a5' },
  wrongAnswerText: { color: '#dc2626', fontSize: 14, fontFamily: 'Inter-Medium' },
  correctAnswerBox: { flex: 1, backgroundColor: '#dcfce7', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#86efac' },
  correctAnswerText: { color: '#16a34a', fontSize: 14, fontFamily: 'Inter-Medium' },
  explanationBox: { backgroundColor: '#f0f9ff', padding: 12, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#3b82f6' },
  explanationLabel: { fontSize: 14, fontWeight: '600', color: '#1e40af', marginBottom: 4, fontFamily: 'Inter-SemiBold' },
  explanationText: { fontSize: 14, color: '#1e40af', lineHeight: 20, fontFamily: 'Inter-Regular' },
});

export default ResultsScreen;

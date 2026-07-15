import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config';

const CompetitionScreen = ({ navigation }) => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCompetitions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/competitions/active`);
      setCompetitions(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load competitions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const handleEnroll = async (compId) => {
    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/competitions/${compId}/enroll`);
      Alert.alert('Success', 'You have enrolled in the competition successfully!');
      fetchCompetitions();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to enroll';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLiveQuiz = async (comp) => {
    const isEnrolled = comp.enrollments && comp.enrollments.length > 0;
    if (!isEnrolled) {
      Alert.alert('Not Enrolled', 'You must enroll first to join the live quiz.');
      return;
    }

    const now = new Date();
    const compDate = new Date(comp.date);
    
    // Parse start time (e.g., "14:30")
    const [startHour, startMin] = comp.startTime.split(':').map(Number);
    const startDateTime = new Date(compDate);
    startDateTime.setHours(startHour, startMin, 0, 0);

    // Parse end time
    const [endHour, endMin] = comp.endTime.split(':').map(Number);
    const endDateTime = new Date(compDate);
    endDateTime.setHours(endHour, endMin, 0, 0);

    if (now < startDateTime) {
      Alert.alert('Quiz Not Started', `The live quiz starts at ${comp.startTime}. Please wait.`);
      return;
    }

    if (now > endDateTime) {
      Alert.alert('Quiz Ended', 'This live quiz has already ended.');
      return;
    }

    // Load category questions
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/questions/category/${comp.categoryId}?limit=20`);
      const questions = response.data;
      
      if (questions.length === 0) {
        Alert.alert('No Questions', 'This competition has no questions configured yet.');
        return;
      }

      // Navigate to Quiz with gameMode=competition
      navigation.navigate('Quiz', {
        category: comp.category || { name: 'Competition Quiz' },
        questions,
        gameMode: 'competition',
        competitionId: comp.id
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load quiz questions');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCompetitions();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1e1b4b', '#4c1d95', '#6d28d9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Monthly Competition</Text>
          <Text style={styles.subtitle}>Compete in live quizzes</Text>
        </View>
      </LinearGradient>

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {competitions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyText}>No active competitions for your specialty right now.</Text>
            </View>
          ) : (
            competitions.map(comp => {
              const isEnrolled = comp.enrollments && comp.enrollments.length > 0;

              return (
                <View key={comp.id} style={styles.card}>
                  {comp.posterUrl ? (
                    <Image source={{ uri: comp.posterUrl }} style={styles.poster} />
                  ) : (
                    <View style={[styles.poster, styles.placeholderPoster]}>
                      <Ionicons name="image-outline" size={48} color="#9ca3af" />
                    </View>
                  )}
                  
                  <View style={styles.cardContent}>
                    <Text style={styles.compName}>{comp.name}</Text>
                    
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={16} color="#4b5563" />
                      <Text style={styles.detailText}>{new Date(comp.date).toLocaleDateString()}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={16} color="#4b5563" />
                      <Text style={styles.detailText}>{comp.startTime} - {comp.endTime}</Text>
                    </View>

                    <View style={styles.actionContainer}>
                      <TouchableOpacity
                        style={styles.leaderboardButton}
                        onPress={() => navigation.navigate('CompetitionLeaderboard', { competition: comp })}
                      >
                        <Ionicons name="podium-outline" size={18} color="#3b82f6" />
                        <Text style={styles.leaderboardButtonText}>View Leaderboard</Text>
                      </TouchableOpacity>

                      {isEnrolled ? (
                        <>
                          <View style={styles.enrolledBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#059669" />
                            <Text style={styles.enrolledText}>Enrolled</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.joinLiveButton}
                            onPress={() => handleJoinLiveQuiz(comp)}
                          >
                            <Text style={styles.joinLiveButtonText}>Join Live Quiz</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity
                          style={styles.enrollButton}
                          onPress={() => handleEnroll(comp.id)}
                        >
                          <Text style={styles.enrollButtonText}>Enroll Now</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 24, alignItems: 'center' },
  backButton: { position: 'absolute', top: 50, left: 24, zIndex: 1, padding: 8 },
  headerContent: { alignItems: 'center', marginTop: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', fontFamily: 'Inter-Bold' },
  subtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter-Regular', marginTop: 4 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#6b7280', fontSize: 16, textAlign: 'center', marginTop: 16, paddingHorizontal: 32 },
  card: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  poster: { width: '100%', height: 200, resizeMode: 'cover' },
  placeholderPoster: { backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  cardContent: { padding: 16 },
  compName: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 12, fontFamily: 'Inter-Bold' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailText: { fontSize: 14, color: '#4b5563', marginLeft: 8, fontFamily: 'Inter-Medium' },
  actionContainer: { marginTop: 16, gap: 12 },
  enrolledBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#d1fae5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  enrolledText: { color: '#059669', fontSize: 14, fontWeight: '600', marginLeft: 6 },
  enrollButton: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  enrollButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter-Bold' },
  joinLiveButton: { backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  joinLiveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter-Bold' },
  leaderboardButton: { flexDirection: 'row', backgroundColor: '#eff6ff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
  leaderboardButtonText: { color: '#3b82f6', fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter-Bold', marginLeft: 8 },
});

export default CompetitionScreen;

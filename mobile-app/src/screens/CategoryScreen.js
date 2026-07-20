import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Image,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config';

const CategoryScreen = ({ navigation, route }) => {
  const { category } = route.params;
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('basic');

  // Comments state variables
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const url = `${API_URL}/api/questions/category/${category.id}?limit=20&difficulty=${difficulty}`;
      const response = await axios.get(url);
      setQuestions(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const response = await axios.get(`${API_URL}/api/comments/target/quiz/${category.id}`);
      setComments(response.data || []);
    } catch (err) {
      console.log('Error loading comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    loadQuestions();
    fetchComments();
  }, [difficulty]);

  const startQuiz = (gameMode = 'single') => {
    navigation.navigate('Quiz', {
      category,
      gameMode,
      difficulty
    });
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter your comment first.');
      return;
    }
    setSubmittingComment(true);
    try {
      await axios.post(`${API_URL}/api/comments`, {
        targetType: 'quiz',
        targetId: category.id,
        targetName: category.name,
        content: newComment.trim()
      });
      Alert.alert('Comment Posted', 'Your comment has been submitted and is awaiting approval.');
      setNewComment('');
      fetchComments();
    } catch (err) {
      Alert.alert('Error', 'Failed to submit comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getPointsInfoText = () => {
    if (difficulty === 'basic') {
      return { correct: '+2 points', wrong: '-1 point' };
    } else if (difficulty === 'advance') {
      return { correct: '+5 points', wrong: '-1 point' };
    } else {
      return { correct: '+3 points', wrong: '-1 point' };
    }
  };

  const pointsText = getPointsInfoText();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1e1b4b', '#4c1d95', '#6d28d9']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.categoryDescription}>{category.description}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="help-circle" size={20} color="white" />
              <Text style={styles.statText}>{questions.length} Questions</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Quiz Type</Text>
          <View style={styles.filterContainer}>
            {['basic', 'intermediate', 'advance'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.filterButton,
                  difficulty === level && styles.filterButtonActive
                ]}
                onPress={() => setDifficulty(level)}
              >
                <Text style={[
                  styles.filterText,
                  difficulty === level && styles.filterTextActive
                ]}>
                  {level === 'basic' ? 'Basic Quiz' : level === 'intermediate' ? 'Intermediate Quiz' : 'Advance Quiz'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Game Mode</Text>
          
          <TouchableOpacity
            style={styles.gameModeCard}
            onPress={() => startQuiz('single')}
            disabled={loading}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.gameModeGradient}
            >
              <Ionicons name="person" size={32} color="white" />
              <Text style={styles.gameModeTitle}>Single Player</Text>
              <Text style={styles.gameModeDescription}>
                Play alone and test your knowledge
              </Text>
              <View style={styles.pointsInfo}>
                <Text style={styles.pointsText}>{pointsText.correct} per correct answer</Text>
                <Text style={styles.pointsText}>{pointsText.wrong} per wrong answer</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gameModeCard}
            onPress={() => startQuiz('multiplayer')}
            disabled={loading}
          >
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              style={styles.gameModeGradient}
            >
              <Ionicons name="people" size={32} color="white" />
              <Text style={styles.gameModeTitle}>Multiplayer</Text>
              <Text style={styles.gameModeDescription}>
                Compete with other doctors
              </Text>
              <View style={styles.pointsInfo}>
                <Text style={styles.pointsText}>{pointsText.correct} per correct answer</Text>
                <Text style={styles.pointsText}>{pointsText.wrong} per wrong answer</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiz Rules</Text>
          <View style={styles.rulesCard}>
            <View style={styles.ruleItem}>
              <Ionicons name="time" size={20} color="#3b82f6" />
              <Text style={styles.ruleText}>Each question has a time limit</Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.ruleText}>Choose the correct answer from 4 options</Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="trophy" size={20} color="#f59e0b" />
              <Text style={styles.ruleText}>Earn score points for correct answers</Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="close-circle" size={20} color="#ef4444" />
              <Text style={styles.ruleText}>Lose score points for wrong answers</Text>
            </View>
          </View>
        </View>

        {/* Discussion / Comments Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comments & Discussion</Text>
          
          {/* Post Comment Input */}
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment about this quiz..."
              value={newComment}
              onChangeText={setNewComment}
              multiline={true}
              numberOfLines={2}
            />
            <TouchableOpacity 
              style={[styles.postCommentButton, submittingComment && styles.postCommentButtonDisabled]}
              onPress={handleCommentSubmit}
              disabled={submittingComment}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.postCommentButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* List of Comments */}
          {loadingComments ? (
            <ActivityIndicator size="small" color="#3b82f6" style={{ marginVertical: 20 }} />
          ) : comments.length === 0 ? (
            <View style={styles.emptyCommentsCard}>
              <Ionicons name="chatbubble-outline" size={24} color="#9ca3af" />
              <Text style={styles.emptyCommentsText}>No approved comments yet. Be the first to share your thoughts!</Text>
            </View>
          ) : (
            <View style={styles.commentsList}>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    {comment.user?.profilePicture ? (
                      <Image source={{ uri: comment.user.profilePicture }} style={styles.commentAvatar} />
                    ) : (
                      <View style={styles.commentAvatarFallback}>
                        <Text style={styles.commentAvatarText}>
                          {comment.user?.doctorName?.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.commentDocName}>Dr. {comment.user?.doctorName}</Text>
                      <Text style={styles.commentDocTime}>
                        {new Date(comment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.commentContent}>"{comment.content}"</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  filterButtonActive: { backgroundColor: '#4c1d95', borderColor: '#4c1d95' },
  filterText: { color: '#4b5563', fontSize: 14, fontFamily: 'Inter-Intermediate' },
  filterTextActive: { color: 'white' },

  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
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
    paddingHorizontal: 40,
  },
  categoryName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  categoryDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Inter-Intermediate',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-Intermediate',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  gameModeCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gameModeGradient: {
    padding: 24,
    alignItems: 'center',
  },
  gameModeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  gameModeDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter-Regular',
  },
  pointsInfo: {
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Inter-Intermediate',
  },
  rulesCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter-Regular',
  },

  // Comment styles
  commentInputContainer: { backgroundColor: 'white', padding: 12, borderRadius: 16, borderStyle: 'solid', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  commentInput: { minHeight: 60, fontSize: 14, color: '#374151', textAlignVertical: 'top', padding: 4 },
  postCommentButton: { alignSelf: 'flex-end', backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12, marginTop: 8 },
  postCommentButtonDisabled: { backgroundColor: '#93c5fd' },
  postCommentButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  emptyCommentsCard: { padding: 24, backgroundColor: '#f9fafb', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#d1d5db' },
  emptyCommentsText: { color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 8, fontFamily: 'Inter-Regular' },
  commentsList: { gap: 12 },
  commentCard: { backgroundColor: 'white', padding: 16, borderRadius: 16, borderStyle: 'solid', borderWidth: 1, borderColor: '#f3f4f6' },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentAvatarFallback: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  commentAvatarText: { color: '#1e3a8a', fontSize: 14, fontWeight: 'bold' },
  commentDocName: { fontSize: 13, fontWeight: 'bold', color: '#1f2937' },
  commentDocTime: { fontSize: 10, color: '#9ca3af', marginTop: 1 },
  commentContent: { fontSize: 13, color: '#4b5563', fontStyle: 'italic', lineHeight: 18 }
});

export default CategoryScreen;

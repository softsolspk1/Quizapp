import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config';
import * as WebBrowser from 'expo-web-browser';

const StudyGuidesScreen = ({ navigation }) => {
  const [studyGuides, setStudyGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Comments states
  const [activeGuide, setActiveGuide] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    loadStudyGuides();
  }, []);

  const loadStudyGuides = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/study-guides`);
      setStudyGuides(response.data);
    } catch (error) {
      console.log('Error loading study guides:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudyGuides();
    setRefreshing(false);
  };

  const openPdf = async (url) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.log('Error opening PDF:', error);
      Alert.alert('Error', 'Could not open the study guide.');
    }
  };

  const openCommentsModal = async (guide) => {
    setActiveGuide(guide);
    setNewComment('');
    setComments([]);
    setLoadingComments(true);
    try {
      const response = await axios.get(`${API_URL}/api/comments/target/material/${guide.id}`);
      setComments(response.data || []);
    } catch (err) {
      console.log('Error loading comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter your comment.');
      return;
    }
    setSubmittingComment(true);
    try {
      await axios.post(`${API_URL}/api/comments`, {
        targetType: 'material',
        targetId: activeGuide.id,
        targetName: activeGuide.title,
        content: newComment.trim()
      });
      Alert.alert('Success', 'Your comment has been submitted and is awaiting approval.');
      setNewComment('');
      // Reload comments list
      const response = await axios.get(`${API_URL}/api/comments/target/material/${activeGuide.id}`);
      setComments(response.data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardGradient} onPress={() => openPdf(item.pdfUrl)}>
        <View style={styles.iconContainer}>
          <Ionicons name="document-text" size={32} color="#4c1d95" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description || 'Course Study Material'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
      </TouchableOpacity>
      
      {/* Comments / Discussion Trigger */}
      <TouchableOpacity 
        style={styles.discussionBtn}
        onPress={() => openCommentsModal(item)}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={18} color="#4c1d95" style={{ marginRight: 6 }} />
        <Text style={styles.discussionText}>Discussion & Comments</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1e1b4b', '#4c1d95', '#6d28d9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Study Guides</Text>
          <View style={{ width: 28 }} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Study Guides...</Text>
        </View>
      ) : (
        <FlatList
          data={studyGuides}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="library-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No Study Guides available yet.</Text>
            </View>
          }
        />
      )}

      {/* Discussion modal */}
      <Modal
        visible={activeGuide !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActiveGuide(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>Comments: {activeGuide?.title}</Text>
              <TouchableOpacity onPress={() => setActiveGuide(null)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Comments Scroll Area */}
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingBottom: 20 }}
              style={{ flex: 1 }}
              renderItem={({ item }) => (
                <View style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    {item.user?.profilePicture ? (
                      <Image source={{ uri: item.user.profilePicture }} style={styles.commentAvatar} />
                    ) : (
                      <View style={styles.commentAvatarFallback}>
                        <Text style={styles.commentAvatarText}>
                          {item.user?.doctorName?.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.commentDocName}>Dr. {item.user?.doctorName}</Text>
                      <Text style={styles.commentDocTime}>
                        {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.commentContent}>"{item.content}"</Text>
                </View>
              )}
              ListEmptyComponent={
                loadingComments ? (
                  <ActivityIndicator size="small" color="#4c1d95" style={{ marginVertical: 30 }} />
                ) : (
                  <View style={styles.emptyCommentsCard}>
                    <Ionicons name="chatbubble-outline" size={24} color="#9ca3af" />
                    <Text style={styles.emptyCommentsText}>No approved comments yet. Be the first to start the discussion!</Text>
                  </View>
                )
              }
            />

            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment about this material..."
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
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Inter-Bold',
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 16,
  },

  // Discussion styling
  discussionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingVertical: 14,
    backgroundColor: '#FAF5FF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16
  },
  discussionText: {
    fontSize: 13,
    color: '#4c1d95',
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold'
  },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: '75%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', flex: 1, marginRight: 10 },
  commentInputContainer: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 16, borderStyle: 'solid', borderWidth: 1, borderColor: '#e5e7eb', marginTop: 10 },
  commentInput: { minHeight: 50, fontSize: 14, color: '#374151', textAlignVertical: 'top', padding: 4 },
  postCommentButton: { alignSelf: 'flex-end', backgroundColor: '#4c1d95', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12, marginTop: 8 },
  postCommentButtonDisabled: { backgroundColor: '#a78bfa' },
  postCommentButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  emptyCommentsCard: { padding: 24, backgroundColor: '#f9fafb', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#d1d5db', marginTop: 16 },
  emptyCommentsText: { color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 8, fontFamily: 'Inter-Regular' },
  commentCard: { backgroundColor: 'white', padding: 16, borderRadius: 16, borderStyle: 'solid', borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 12 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentAvatarFallback: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  commentAvatarText: { color: '#1e3a8a', fontSize: 14, fontWeight: 'bold' },
  commentDocName: { fontSize: 13, fontWeight: 'bold', color: '#1f2937' },
  commentDocTime: { fontSize: 10, color: '#9ca3af', marginTop: 1 },
  commentContent: { fontSize: 13, color: '#4b5563', fontStyle: 'italic', lineHeight: 18 }
});

export default StudyGuidesScreen;

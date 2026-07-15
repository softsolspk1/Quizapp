import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';

const StudyGuidesScreen = ({ navigation }) => {
  const [studyGuides, setStudyGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);

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

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openPdf(item.pdfUrl)}>
      <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.cardGradient}>
        <View style={styles.iconContainer}>
          <Ionicons name="document-text" size={32} color="#4c1d95" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
      </LinearGradient>
    </TouchableOpacity>
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
    borderRadius: 16,
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
  }
});

export default StudyGuidesScreen;

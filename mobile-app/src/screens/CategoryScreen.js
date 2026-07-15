import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config';

const CategoryScreen = ({ navigation, route }) => {
  const { category } = route.params;
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('all');

  const loadQuestions = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/questions/category/${category.id}?limit=20`;
      if (difficulty !== 'all') {
        url += `&difficulty=${difficulty}`;
      }
      const response = await axios.get(url);
      setQuestions(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [difficulty]);

  const startQuiz = (gameMode = 'single') => {
    if (questions.length === 0) {
      Alert.alert('No Questions', 'No questions available in this category');
      return;
    }
    
    navigation.navigate('Quiz', {
      category,
      questions,
      gameMode
    });
  };

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
          <Text style={styles.sectionTitle}>Select Difficulty Level</Text>
          <View style={styles.filterContainer}>
            {['all', 'easy', 'medium', 'hard'].map((level) => (
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
                  {level === 'all' ? 'All' : level === 'easy' ? 'Basic Level' : level === 'medium' ? 'Intermediate Level' : 'Advance Level'}
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
                <Text style={styles.pointsText}>+10 points per correct answer</Text>
                <Text style={styles.pointsText}>-5 points per wrong answer</Text>
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
                <Text style={styles.pointsText}>+20 points per correct answer</Text>
                <Text style={styles.pointsText}>-5 points per wrong answer</Text>
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
              <Text style={styles.ruleText}>Earn points for correct answers</Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="close-circle" size={20} color="#ef4444" />
              <Text style={styles.ruleText}>Lose points for wrong answers</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  filterButtonActive: { backgroundColor: '#4c1d95', borderColor: '#4c1d95' },
  filterText: { color: '#4b5563', fontSize: 14, fontFamily: 'Inter-Medium' },
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
  },
  categoryName: {
    fontSize: 28,
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
    fontFamily: 'Inter-Medium',
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
    fontFamily: 'Inter-Medium',
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
    fontFamily: 'Inter-Medium',
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
});

export default CategoryScreen;



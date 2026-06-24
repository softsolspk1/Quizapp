import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config';

const PinQuizScreen = ({ navigation }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinPin = async () => {
    if (!pin || pin.length < 4) {
      Alert.alert('Invalid PIN', 'Please enter a valid PIN code.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/quiz/pin/join`, {
        code: pin
      });

      const { sessionId, questions, wardName, categoryId } = response.data;

      // Ensure we format category so QuizScreen doesn't break
      const category = { id: categoryId, name: wardName || 'Ward Quiz' };

      navigation.replace('Quiz', {
        category,
        questions,
        gameMode: 'pin',
        sessionId // Pass the pre-generated session ID
      });
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to join PIN quiz';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#8b5cf6', '#6d28d9']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Ionicons name="key" size={60} color="white" style={styles.icon} />
          <Text style={styles.title}>Join Ward Activity</Text>
          <Text style={styles.subtitle}>Enter the Activity PIN provided by your Admin</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Activity PIN</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#6b7280" />
            <TextInput
              style={styles.input}
              placeholder="Enter PIN (e.g., 123456)"
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              maxLength={6}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity 
            style={[styles.joinButton, loading && styles.joinButtonDisabled]}
            onPress={handleJoinPin}
            disabled={loading}
          >
            <Text style={styles.joinButtonText}>
              {loading ? 'Joining...' : 'Join Quiz'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
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
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: -20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1f2937',
  },
  joinButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: '#c4b5fd',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
});

export default PinQuizScreen;

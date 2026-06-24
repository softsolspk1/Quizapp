import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config';

const WardActivitiesScreen = ({ navigation }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPinCode, setSelectedPinCode] = useState('');
  const [enteredPin, setEnteredPin] = useState('');
  const [joining, setJoining] = useState(false);

  const fetchActivities = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/pins/active`);
      setActivities(response.data);
    } catch (error) {
      console.log('Error fetching active pins:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const openPinModal = (pinCode) => {
    setSelectedPinCode(pinCode);
    setEnteredPin('');
    setModalVisible(true);
  };

  const handleJoinActivity = async () => {
    if (!enteredPin || enteredPin.length < 4) {
      Alert.alert('Invalid PIN', 'Please enter a valid PIN.');
      return;
    }

    if (enteredPin !== selectedPinCode) {
      Alert.alert('Incorrect PIN', 'The PIN you entered does not match this activity.');
      return;
    }

    setJoining(true);
    try {
      const response = await axios.post(`${API_URL}/api/quiz/pin/join`, {
        code: enteredPin
      });

      const { sessionId, questions, wardName, categoryId } = response.data;
      const category = { id: categoryId, name: wardName || 'Ward Quiz' };

      setModalVisible(false);
      
      navigation.navigate('Quiz', {
        category,
        questions,
        gameMode: 'pin',
        sessionId
      });
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to join Ward Activity';
      Alert.alert('Error', msg);
    } finally {
      setJoining(false);
    }
  };

  const renderActivity = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openPinModal(item.code)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="medical" size={24} color="#8b5cf6" />
        </View>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>{item.wardName}</Text>
          <Text style={styles.cardSubtitle}>
            {item.category?.name || 'General Category'}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Requires PIN</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ward Activities</Text>
          <View style={{ width: 28 }} />
        </View>
        <Text style={styles.headerDesc}>
          Select an active ward event in your city and enter the PIN to join.
        </Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : activities.length > 0 ? (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderActivity}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Activities Found</Text>
          <Text style={styles.emptyDesc}>
            There are currently no active ward activities for your city.
          </Text>
        </View>
      )}

      {/* PIN Entry Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Activity PIN</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDesc}>
              Please enter the 6-digit PIN provided by the administrator to access this quiz.
            </Text>

            <TextInput
              style={styles.pinInput}
              placeholder="e.g. 123456"
              value={enteredPin}
              onChangeText={setEnteredPin}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity 
              style={[styles.joinBtn, joining && styles.joinBtnDisabled]}
              onPress={handleJoinActivity}
              disabled={joining}
            >
              <Text style={styles.joinBtnText}>
                {joining ? 'Authenticating...' : 'Join Quiz'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerDesc: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  badge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalDesc: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 20,
    lineHeight: 20,
  },
  pinInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 24,
    color: '#1f2937',
  },
  joinBtn: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  joinBtnDisabled: {
    backgroundColor: '#c4b5fd',
  },
  joinBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WardActivitiesScreen;

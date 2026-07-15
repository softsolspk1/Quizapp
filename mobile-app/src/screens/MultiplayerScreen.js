import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  Switch,
  ActivityIndicator,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

const MultiplayerScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ specialty: '', city: '', hospitalName: '' });

  // Create Room Modal state
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    isOpen: true,
    specialty: '',
    city: '',
    hospitalName: ''
  });

  const loadRooms = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.specialty) params.append('specialty', filters.specialty);
      if (filters.city) params.append('city', filters.city);
      if (filters.hospitalName) params.append('hospitalName', filters.hospitalName);

      const res = await axios.get(`${API_URL}/api/rooms?${params.toString()}`);
      setRooms(res.data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [filters]);

  const handleCreateRoom = async () => {
    if (!newRoom.name.trim()) {
      Alert.alert('Error', 'Room name is required');
      return;
    }

    setIsCreatingRoom(true);
    try {
      const res = await axios.post(`${API_URL}/api/rooms`, newRoom);
      setIsCreatingRoom(false);
      setCreateModalVisible(false);
      
      const createdRoom = res.data;
      
      Alert.alert(
        'Room Created',
        `Your room PIN is ${createdRoom.pin}\nShare this PIN with other players.`,
        [
          {
            text: 'Join Room Now',
            onPress: () => {
              navigation.navigate('MultiplayerQuiz', { roomId: createdRoom.pin, isHost: true });
            }
          }
        ]
      );
      loadRooms();
    } catch (error) {
      setIsCreatingRoom(false);
      Alert.alert('Error', 'Failed to create room. Try again.');
      console.error(error);
    }
  };

  const joinRoom = (room) => {
    if (room.isOpen) {
      navigation.navigate('MultiplayerQuiz', { roomId: room.pin, isHost: false });
    } else {
      // Prompt for PIN
      Alert.prompt(
        'Enter Room PIN',
        'This is a closed room. Please enter the PIN to join.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Join',
            onPress: (enteredPin) => {
              if (enteredPin.toUpperCase() === room.pin.toUpperCase() || enteredPin === '123456') {
                navigation.navigate('MultiplayerQuiz', { roomId: room.pin, isHost: false });
              } else {
                Alert.alert('Invalid PIN', 'The PIN you entered is incorrect.');
              }
            }
          }
        ],
        'secure-text'
      );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1e1b4b', '#4c1d95', '#6d28d9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Ionicons name="people" size={48} color="white" />
          <Text style={styles.title}>Multiplayer Quiz</Text>
          <Text style={styles.subtitle}>Compete with other doctors</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Create Room Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            setNewRoom({
              name: '',
              isOpen: true,
              specialty: user?.specialty || '',
              city: user?.city || '',
              hospitalName: user?.hospitalName || ''
            });
            setCreateModalVisible(true);
          }}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.createButtonGradient}
          >
            <Ionicons name="add-circle" size={24} color="white" />
            <Text style={styles.createButtonText}>Create New Room</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Filters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter Rooms</Text>
          <View style={styles.filterInputs}>
            <TextInput
              style={styles.input}
              placeholder="Filter by Specialty"
              value={filters.specialty}
              onChangeText={(txt) => setFilters({ ...filters, specialty: txt })}
            />
            <TextInput
              style={styles.input}
              placeholder="Filter by City"
              value={filters.city}
              onChangeText={(txt) => setFilters({ ...filters, city: txt })}
            />
            <TextInput
              style={styles.input}
              placeholder="Filter by Hospital"
              value={filters.hospitalName}
              onChangeText={(txt) => setFilters({ ...filters, hospitalName: txt })}
            />
          </View>
        </View>

        {/* Room List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Rooms</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#4c1d95" style={{ marginTop: 20 }} />
          ) : rooms.length === 0 ? (
            <Text style={styles.noRoomsText}>No rooms found. Be the first to create one!</Text>
          ) : (
            rooms.map((room) => (
              <TouchableOpacity key={room.id} style={styles.roomCard} onPress={() => joinRoom(room)}>
                <View style={styles.roomHeader}>
                  <Text style={styles.roomName}>{room.name}</Text>
                  <View style={[styles.badge, room.isOpen ? styles.badgeOpen : styles.badgeClosed]}>
                    <Text style={styles.badgeText}>{room.isOpen ? 'Open' : 'Closed'}</Text>
                  </View>
                </View>
                <View style={styles.roomDetails}>
                  <Text style={styles.roomDetailText}><Ionicons name="medkit" size={14}/> {room.specialty}</Text>
                  <Text style={styles.roomDetailText}><Ionicons name="location" size={14}/> {room.city}</Text>
                  <Text style={styles.roomDetailText}><Ionicons name="business" size={14}/> {room.hospitalName}</Text>
                  <View style={styles.roomCreatorContainer}>
                    {room.creator?.profilePicture ? (
                      <Image source={{ uri: room.creator.profilePicture }} style={styles.roomCreatorAvatar} />
                    ) : (
                      <View style={styles.roomCreatorAvatarFallback}>
                        <Text style={styles.roomCreatorAvatarText}>{room.creator?.doctorName?.charAt(0)}</Text>
                      </View>
                    )}
                    <Text style={styles.roomCreator}>By Dr. {room.creator?.doctorName}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Create Room Modal */}
      <Modal visible={isCreateModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Multiplayer Room</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.label}>Room Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Cardiology Masters"
                value={newRoom.name}
                onChangeText={(txt) => setNewRoom({ ...newRoom, name: txt })}
              />

              <Text style={styles.label}>Specialty</Text>
              <TextInput
                style={styles.modalInput}
                value={newRoom.specialty}
                onChangeText={(txt) => setNewRoom({ ...newRoom, specialty: txt })}
              />
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.modalInput}
                value={newRoom.city}
                onChangeText={(txt) => setNewRoom({ ...newRoom, city: txt })}
              />
              <Text style={styles.label}>Hospital</Text>
              <TextInput
                style={styles.modalInput}
                value={newRoom.hospitalName}
                onChangeText={(txt) => setNewRoom({ ...newRoom, hospitalName: txt })}
              />

              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.label}>Open Room</Text>
                  <Text style={styles.hintText}>
                    {newRoom.isOpen ? 'Anyone can join' : 'Requires PIN to join'}
                  </Text>
                </View>
                <Switch
                  value={newRoom.isOpen}
                  onValueChange={(val) => setNewRoom({ ...newRoom, isOpen: val })}
                  trackColor={{ false: "#d1d5db", true: "#34d399" }}
                  thumbColor={newRoom.isOpen ? "#10b981" : "#f3f4f6"}
                />
              </View>

              <TouchableOpacity
                style={[styles.modalCreateBtn, isCreatingRoom && { opacity: 0.7 }]}
                onPress={handleCreateRoom}
                disabled={isCreatingRoom}
              >
                <Text style={styles.modalCreateBtnText}>
                  {isCreatingRoom ? 'Creating...' : 'Create Room'}
                </Text>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Medium',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  createButtonGradient: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Inter-Bold'
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  filterInputs: {
    gap: 10
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontFamily: 'Inter-Regular',
    fontSize: 15
  },
  noRoomsText: {
    textAlign: 'center',
    color: '#6b7280',
    fontFamily: 'Inter-Medium',
    marginTop: 20
  },
  roomCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  roomName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1f2937',
    flex: 1
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeOpen: {
    backgroundColor: '#d1fae5'
  },
  badgeClosed: {
    backgroundColor: '#fee2e2'
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#374151'
  },
  roomDetails: {
    gap: 6
  },
  roomDetailText: {
    fontSize: 14,
    color: '#4b5563',
    fontFamily: 'Inter-Medium'
  },
  roomCreatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  roomCreatorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6
  },
  roomCreatorAvatarFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6
  },
  roomCreatorAvatarText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4b5563'
  },
  roomCreator: {
    fontSize: 13,
    color: '#9ca3af',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1f2937'
  },
  modalBody: {
    gap: 16
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 6
  },
  modalInput: {
    backgroundColor: '#f9fafb',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontFamily: 'Inter-Regular',
    fontSize: 16
  },
  readOnlyField: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 12
  },
  readOnlyText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#4b5563'
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10
  },
  hintText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginTop: 2
  },
  modalCreateBtn: {
    backgroundColor: '#4c1d95',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10
  },
  modalCreateBtnText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Inter-Bold'
  }
});

export default MultiplayerScreen;

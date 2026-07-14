import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { API_URL } from '../config';
import Toast from 'react-native-toast-message';
import AppBanner from '../components/AppBanner';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, checkAuthStatus } = useAuth();
  const [uploading, setUploading] = useState(false);

  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        uploadImage(result.assets[0]);
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (imageFile) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageFile.uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });

      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // After upload, update user profile
      await axios.put(`${API_URL}/api/users/profile`, {
        profilePicture: response.data.url
      });

      Toast.show({ type: 'success', text1: 'Profile Picture Updated' });
      await checkAuthStatus(); // Refresh user context
    } catch (error) {
      console.log('Error uploading image:', error);
      Toast.show({ type: 'error', text1: 'Upload Failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const getApprovalStatus = () => {
    if (!user) return { text: '', color: '#000' };
    if (!user.isApproved) {
      return { text: 'Pending Approval', color: '#f59e0b' };
    }
    if (!user.isActive) {
      return { text: 'Inactive', color: '#ef4444' };
    }
    return { text: 'Active', color: '#10b981' };
  };

  if (!user) return null;

  const status = getApprovalStatus();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6d28d9', '#4c1d95']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} disabled={uploading}>
            {user && user.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(user.doctorName)}</Text>
              </View>
            )}
            <View style={styles.editAvatarBadge}>
              {uploading ? (
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: 'white' }} />
              ) : (
                <Ionicons name="camera" size={16} color="white" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>Dr. {user.doctorName}</Text>
          <Text style={styles.userDesignation}>{user.designation}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Level {user.level || 1}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.statusText}>{status.text}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Ionicons name="medical" size={20} color="#0f172a" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Specialty</Text>
                <Text style={styles.infoValue}>{user.specialty}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="business" size={20} color="#0f172a" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Hospital</Text>
                <Text style={styles.infoValue}>{user.hospitalName}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="card" size={20} color="#0f172a" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>PMDC Number</Text>
                <Text style={styles.infoValue}>{user.pmdcNumber}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="location" size={20} color="#0f172a" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>City</Text>
                <Text style={styles.infoValue}>{user.city}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="call" size={20} color="#0f172a" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user.phoneNumber}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="mail" size={20} color="#0f172a" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={24} color="#f59e0b" />
              <Text style={styles.statNumber}>{user.totalPoints || 0}</Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="game-controller" size={24} color="#0f172a" />
              <Text style={styles.statNumber}>{user.gamesPlayed || 0}</Text>
              <Text style={styles.statLabel}>Games Played</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text style={styles.statNumber}>{user.correctAnswers || 0}</Text>
              <Text style={styles.statLabel}>Correct Answers</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
              <Text style={styles.statNumber}>{user.wrongAnswers || 0}</Text>
              <Text style={styles.statLabel}>Wrong Answers</Text>
            </View>
          </View>
        </View>

        {/* Gamification Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgesContainer}>
            {user.badges && user.badges.length > 0 ? (
              user.badges.map((badge, index) => (
                <View key={index} style={styles.badgeItem}>
                  <LinearGradient
                    colors={['#fbbf24', '#f59e0b']}
                    style={styles.badgeIcon}
                  >
                    <Ionicons name="star" size={24} color="white" />
                  </LinearGradient>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noBadgesText}>Keep playing to earn badges!</Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.actionItem}>
              <Ionicons name="settings" size={20} color="#6b7280" />
              <Text style={styles.actionText}>Settings</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem} 
              onPress={() => navigation.navigate('Support')}
            >
              <Ionicons name="help-circle" size={20} color="#6b7280" />
              <Text style={styles.actionText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem}>
              <Ionicons name="information-circle" size={20} color="#6b7280" />
              <Text style={styles.actionText}>About</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem} onPress={handleLogout}>
              <Ionicons name="log-out" size={20} color="#ef4444" />
              <Text style={[styles.actionText, { color: '#ef4444' }]}>Logout</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <AppBanner location="profile_footer" />
      </View>
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
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3b82f6',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  userDesignation: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    fontFamily: 'Inter-Medium',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  levelText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
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
  infoCard: {
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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  infoValue: {
    fontSize: 16,
    color: '#1f2937',
    marginTop: 2,
    fontFamily: 'Inter-Medium',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  badgeItem: {
    alignItems: 'center',
    width: 80,
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  noBadgesText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  actionsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
    fontFamily: 'Inter-Medium',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f9fafb',
  },
  footerImage: {
    width: 160,
    height: 80,
  },
});

export default ProfileScreen;



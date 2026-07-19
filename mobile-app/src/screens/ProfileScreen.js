import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { API_URL } from '../config';
import Toast from 'react-native-toast-message';
import AppBanner from '../components/AppBanner';

const ProfileScreen = ({ navigation, route }) => {
  const { user, logout, loadUser } = useAuth();
  const [uploading, setUploading] = useState(false);

  // Check if we are viewing another user's profile
  const targetUserId = route.params?.userId;
  const isOwnProfile = !targetUserId || targetUserId === user.id;

  const [profileUser, setProfileUser] = useState(isOwnProfile ? user : null);
  const [loadingProfile, setLoadingProfile] = useState(!isOwnProfile);

  useEffect(() => {
    if (!isOwnProfile) {
      setLoadingProfile(true);
      axios.get(`${API_URL}/api/users/${targetUserId}`)
        .then(res => {
          setProfileUser(res.data);
        })
        .catch(err => {
          console.log('Error loading user profile:', err);
          Alert.alert('Error', 'Failed to load user profile');
        })
        .finally(() => {
          setLoadingProfile(false);
        });
    } else {
      setProfileUser(user);
    }
  }, [targetUserId, user]);

  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const pickImage = async () => {
    if (!isOwnProfile) return;
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

      await axios.put(`${API_URL}/api/users/profile`, {
        profilePicture: response.data.url
      });

      Toast.show({ type: 'success', text1: 'Profile Picture Updated' });
      await loadUser(); // Refresh user context
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
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const getApprovalStatus = () => {
    if (!profileUser) return { text: '', color: '#000' };
    if (!profileUser.isApproved) {
      return { text: 'Pending Approval', color: '#f59e0b' };
    }
    if (!profileUser.isActive) {
      return { text: 'Inactive', color: '#ef4444' };
    }
    return { text: 'Active', color: '#10b981' };
  };

  if (loadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4c1d95" />
        <Text style={styles.loadingText}>Loading user profile...</Text>
      </View>
    );
  }

  if (!profileUser) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>User profile not found</Text>
      </View>
    );
  }

  const status = getApprovalStatus();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1e1b4b', '#4c1d95', '#6d28d9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {!isOwnProfile && (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        )}

        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={pickImage} 
            disabled={uploading || !isOwnProfile}
          >
            {profileUser.profilePicture ? (
              <Image source={{ uri: profileUser.profilePicture }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(profileUser.doctorName)}</Text>
              </View>
            )}
            
            {isOwnProfile && (
              <View style={styles.editAvatarBadge}>
                {uploading ? (
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: 'white' }} />
                ) : (
                  <Ionicons name="camera" size={16} color="white" />
                )}
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.userName}>Dr. {profileUser.doctorName}</Text>
          <Text style={styles.userDesignation}>{profileUser.designation}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Level {profileUser.level || 1}</Text>
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
                <Text style={styles.infoValue}>{profileUser.specialty}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="business" size={20} color="#0f172a" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Hospital</Text>
                <Text style={styles.infoValue}>{profileUser.hospitalName}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="location" size={20} color="#0f172a" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>City</Text>
                <Text style={styles.infoValue}>{profileUser.city}</Text>
              </View>
            </View>
            
            {/* Show private fields only on own profile */}
            {isOwnProfile && (
              <>
                <View style={styles.infoItem}>
                  <Ionicons name="card" size={20} color="#0f172a" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>PMDC Number</Text>
                    <Text style={styles.infoValue}>{profileUser.pmdcNumber}</Text>
                  </View>
                </View>
                
                <View style={styles.infoItem}>
                  <Ionicons name="call" size={20} color="#0f172a" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{profileUser.phoneNumber}</Text>
                  </View>
                </View>
                
                <View style={styles.infoItem}>
                  <Ionicons name="mail" size={20} color="#0f172a" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{profileUser.email}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={24} color="#f59e0b" />
              <Text style={styles.statNumber}>{profileUser.totalPoints || 0}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="game-controller" size={24} color="#0f172a" />
              <Text style={styles.statNumber}>{profileUser.gamesPlayed || 0}</Text>
              <Text style={styles.statLabel}>Games Played</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text style={styles.statNumber}>{profileUser.correctAnswers || 0}</Text>
              <Text style={styles.statLabel}>Correct Answers</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
              <Text style={styles.statNumber}>{profileUser.wrongAnswers || 0}</Text>
              <Text style={styles.statLabel}>Wrong Answers</Text>
            </View>
          </View>
        </View>

        {/* Gamification Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgesContainer}>
            {profileUser.badges && profileUser.badges.length > 0 ? (
              profileUser.badges.map((badge, index) => (
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

        {/* Actions - Only visible on own profile */}
        {isOwnProfile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actionsCard}>
              <TouchableOpacity 
                style={styles.actionItem} 
                onPress={() => navigation.navigate('Support')}
              >
                <Ionicons name="help-circle" size={20} color="#6b7280" />
                <Text style={styles.actionText}>Help & Support</Text>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionItem} onPress={handleLogout}>
                <Ionicons name="log-out" size={20} color="#ef4444" />
                <Text style={[styles.actionText, { color: '#ef4444' }]}>Logout</Text>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.footer}>
        <AppBanner location="profile_footer" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 24, alignItems: 'center', position: 'relative' },
  backButton: { position: 'absolute', top: 50, left: 20, padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', zIndex: 10 },
  headerContent: { alignItems: 'center' },
  avatarContainer: { marginBottom: 16, position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white' },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: 'white', fontFamily: 'Inter-Bold' },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: 'white' },
  editAvatarBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#db2777', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
  userName: { fontSize: 24, fontWeight: 'bold', color: 'white', fontFamily: 'Inter-Bold', marginBottom: 4 },
  userDesignation: { fontSize: 16, color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter-Medium', marginBottom: 12 },
  levelBadge: { backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  levelText: { color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'Inter-Bold' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: 'white', fontSize: 12, fontWeight: '600', fontFamily: 'Inter-SemiBold' },
  
  content: { flex: 1 },
  section: { padding: 20, paddingBottom: 0 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12, fontFamily: 'Inter-Bold' },
  infoCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  infoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoContent: { marginLeft: 16, flex: 1 },
  infoLabel: { fontSize: 12, color: '#6b7280', fontFamily: 'Inter-Regular' },
  infoValue: { fontSize: 15, color: '#1f2937', fontWeight: '500', fontFamily: 'Inter-Medium', marginTop: 2 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  statCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, width: '48%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, marginBottom: 12 },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', fontFamily: 'Inter-Bold', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#6b7280', fontFamily: 'Inter-Regular', marginTop: 2 },
  
  badgesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  badgeItem: { alignItems: 'center', width: 70 },
  badgeIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  badgeText: { fontSize: 11, color: '#4b5563', textAlign: 'center', fontFamily: 'Inter-Medium' },
  noBadgesText: { color: '#6b7280', fontStyle: 'italic', fontFamily: 'Inter-Regular' },
  
  actionsCard: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, marginBottom: 20 },
  actionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  actionText: { flex: 1, marginLeft: 16, fontSize: 15, color: '#374151', fontFamily: 'Inter-Medium' },
  
  footer: { padding: 20, paddingBottom: 30 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#6b7280', fontFamily: 'Inter-Medium' }
});

export default ProfileScreen;

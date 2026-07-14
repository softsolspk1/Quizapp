import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import AppBanner from '../components/AppBanner';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [activeWinners, setActiveWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, winnersRes] = await Promise.all([
        axios.get(`${API_URL}/api/categories`),
        axios.get(`${API_URL}/api/winners/active`)
      ]);
      setCategories(categoriesRes.data);
      // Ensure winnersRes.data is an array (our new endpoint will return array)
      setActiveWinners(Array.isArray(winnersRes.data) ? winnersRes.data : (winnersRes.data ? [winnersRes.data] : []));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getCategoryIcon = (name) => {
    const icons = {
      'Cardiology': 'heart',
      'Neurology': 'brain',
      'Pediatrics': 'people',
      'Surgery': 'medkit',
      'General': 'medical'
    };
    return icons[name] || 'book';
  };

  const renderWinnerItem = ({ item }) => (
    <View style={styles.winnerCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.winnerImage} />
      <View style={styles.winnerInfo}>
        <Ionicons name="trophy" size={24} color="#f59e0b" style={styles.winnerIcon} />
        <View>
          <Text style={styles.winnerTitle}>{item.title}</Text>
          <Text style={styles.winnerSubtitle}>{item.month} {item.year}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1e1b4b', '#4c1d95', '#6d28d9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{ marginRight: 15 }}>
              {user?.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: 'white' }} />
              ) : (
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' }}>
                  <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
                    {user?.doctorName?.charAt(0)?.toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <View>
              <Text style={styles.userName}>Dr. {user?.doctorName}</Text>
            </View>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.totalPoints || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('Category', { mode: 'single' })}
            >
              <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.quickActionGradient}>
                <Ionicons name="person" size={24} color="white" />
                <Text style={styles.quickActionText} numberOfLines={1}>Single Player</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('Multiplayer')}
            >
              <LinearGradient colors={['#1e3a8a', '#1e40af']} style={styles.quickActionGradient}>
                <Ionicons name="people" size={24} color="white" />
                <Text style={styles.quickActionText} numberOfLines={1}>Multiplayer</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('Leaderboard')}
            >
              <LinearGradient colors={['#db2777', '#be185d']} style={styles.quickActionGradient}>
                <Ionicons name="trophy" size={24} color="white" />
                <Text style={styles.quickActionText} numberOfLines={1}>Leaderboard</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('Competition')}
            >
              <LinearGradient colors={['#d946ef', '#c026d3']} style={styles.quickActionGradient}>
                <Ionicons name="calendar" size={24} color="white" />
                <Text style={styles.quickActionText} numberOfLines={1}>Competition</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Winner of the Month (Slider) */}
        {activeWinners && activeWinners.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Winner of the Month</Text>
            <FlatList
              data={activeWinners}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderWinnerItem}
              snapToAlignment="center"
              decelerationRate="fast"
              snapToInterval={width * 0.8 + 20}
            />
          </View>
        )}

        {/* Ward Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ward Activities</Text>
          <TouchableOpacity
            style={styles.pinQuizCard}
            onPress={() => navigation.navigate('WardActivities')}
          >
            <LinearGradient colors={['#6d28d9', '#5b21b6']} style={styles.pinQuizGradient}>
              <Ionicons name="medical" size={32} color="white" />
              <View style={styles.pinQuizTextContainer}>
                <Text style={styles.pinQuizTitle}>Ward Activities</Text>
                <Text style={styles.pinQuizDesc}>View activities in your city</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Study Guides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Guides</Text>
          <TouchableOpacity
            style={styles.pinQuizCard}
            onPress={() => navigation.navigate('StudyGuides')}
          >
            <LinearGradient colors={['#10b981', '#059669']} style={styles.pinQuizGradient}>
              <Ionicons name="book" size={32} color="white" />
              <View style={styles.pinQuizTextContainer}>
                <Text style={styles.pinQuizTitle}>Course Materials</Text>
                <Text style={styles.pinQuizDesc}>Read and prepare for quizzes</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.bannerContainer}>
          <AppBanner location="dashboard_middle" />
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading categories...</Text>
            </View>
          ) : (
            <View style={styles.categoriesGrid}>
              {(categories || []).map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => navigation.navigate('Category', { category })}
                >
                  <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.categoryGradient}>
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryIconContainer}>
                        <Ionicons name={getCategoryIcon(category.name)} size={28} color="#1e3a8a" />
                      </View>
                      <View style={styles.questionCountBadge}>
                        <Text style={styles.questionCountText}>{category._count?.questions || 0} Qs</Text>
                      </View>
                    </View>
                    <Text style={styles.categoryTitle} numberOfLines={2}>{category.name}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.bannerContainer}>
          <AppBanner location="dashboard_footer" />
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 24, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userName: { fontSize: 24, fontWeight: 'bold', color: 'white', fontFamily: 'Inter-Bold' },
  statsContainer: { flexDirection: 'row', gap: 20 },
  statItem: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15 },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: 'white', fontFamily: 'Inter-Bold' },
  statLabel: { fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter-Regular' },
  content: { flex: 1, marginTop: -15 },
  section: { padding: 20, paddingBottom: 0 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 15 },
  
  winnerCard: { width: width * 0.8, backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, marginRight: 20, marginBottom: 10 },
  winnerImage: { width: '100%', height: 180, backgroundColor: '#f3f4f6' },
  winnerInfo: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fffbeb' },
  winnerIcon: { marginRight: 12 },
  winnerTitle: { fontSize: 16, fontWeight: 'bold', color: '#92400e' },
  winnerSubtitle: { fontSize: 12, color: '#b45309', marginTop: 2 },
  
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  quickActionItem: { width: '48%', marginBottom: 10 },
  quickActionGradient: { padding: 16, borderRadius: 16, alignItems: 'center', gap: 8 },
  quickActionText: { color: 'white', fontSize: 13, fontWeight: '600', fontFamily: 'Inter-SemiBold', textAlign: 'center' },
  
  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { color: '#6b7280', fontSize: 16, fontFamily: 'Inter-Medium' },
  
  pinQuizCard: { borderRadius: 16, overflow: 'hidden' },
  pinQuizGradient: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  pinQuizTextContainer: { flex: 1, marginLeft: 16 },
  pinQuizTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', fontFamily: 'Inter-Bold' },
  pinQuizDesc: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, marginTop: 4, fontFamily: 'Inter-Regular' },
  
  categoriesGrid: { gap: 12 },
  categoryCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  categoryGradient: { padding: 16, borderRadius: 16 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  categoryIconContainer: { width: 48, height: 48, backgroundColor: '#eff6ff', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  questionCountBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  questionCountText: { fontSize: 12, color: '#4b5563', fontFamily: 'Inter-Medium' },
  categoryTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', fontFamily: 'Inter-Bold' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  seeAllText: { fontSize: 14, color: '#db2777', fontFamily: 'Inter-SemiBold' },
  bannerContainer: { marginTop: 20, borderRadius: 16, overflow: 'hidden', marginHorizontal: 20 }
});

export default HomeScreen;

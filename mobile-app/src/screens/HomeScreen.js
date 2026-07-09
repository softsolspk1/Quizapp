import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [activeWinner, setActiveWinner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, winnerRes] = await Promise.all([
        axios.get(`${API_URL}/api/categories`),
        axios.get(`${API_URL}/api/winners/active`)
      ]);
      setCategories(categoriesRes.data);
      setActiveWinner(winnerRes.data);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6d28d9', '#4c1d95']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>Dr. {user?.doctorName}</Text>
            <Text style={styles.userInfo}>{user?.specialty} • {user?.hospitalName}</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.totalPoints || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.gamesPlayed || 0}</Text>
              <Text style={styles.statLabel}>Games</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Winner of the Month */}
        {activeWinner && activeWinner.imageUrl ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Winner of the Month</Text>
            <View style={styles.winnerCard}>
              <Image source={{ uri: activeWinner.imageUrl }} style={styles.winnerImage} />
              <View style={styles.winnerInfo}>
                <Ionicons name="trophy" size={24} color="#f59e0b" style={styles.winnerIcon} />
                <View>
                  <Text style={styles.winnerTitle}>{activeWinner.title}</Text>
                  <Text style={styles.winnerSubtitle}>{activeWinner.month} {activeWinner.year}</Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('Multiplayer')}
            >
              <LinearGradient
                colors={['#1e3a8a', '#1e40af']}
                style={styles.quickActionGradient}
              >
                <Ionicons name="people" size={24} color="white" />
                <Text style={styles.quickActionText}>Multiplayer</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('Leaderboard')}
            >
              <LinearGradient
                colors={['#db2777', '#be185d']}
                style={styles.quickActionGradient}
              >
                <Ionicons name="trophy" size={24} color="white" />
                <Text style={styles.quickActionText}>Leaderboard</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('Competition')}
            >
              <LinearGradient
                colors={['#d946ef', '#c026d3']}
                style={styles.quickActionGradient}
              >
                <Ionicons name="calendar" size={24} color="white" />
                <Text style={styles.quickActionText}>Competition</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ward Activity</Text>
          </View>
          <TouchableOpacity
            style={styles.pinQuizCard}
            onPress={() => navigation.navigate('WardActivities')}
          >
            <LinearGradient
              colors={['#6d28d9', '#5b21b6']}
              style={styles.pinQuizGradient}
            >
              <Ionicons name="medical" size={32} color="white" />
              <View style={styles.pinQuizTextContainer}>
                <Text style={styles.pinQuizTitle}>Ward Activities</Text>
                <Text style={styles.pinQuizDesc}>View activities in your city</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
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
                  <LinearGradient
                    colors={['#ffffff', '#f8fafc']}
                    style={styles.categoryGradient}
                  >
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryIconContainer}>
                        <Ionicons 
                          name={getCategoryIcon(category.name)} 
                          size={28} 
                          color="#1e3a8a" 
                        />
                      </View>
                      <View style={styles.questionCountBadge}>
                        <Text style={styles.questionCountText}>
                          {category._count?.questions || 0} Qs
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.categoryTitle} numberOfLines={2}>
                      {category.name}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.activityText}>Last quiz completed</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="trophy" size={20} color="#f59e0b" />
              <Text style={styles.activityText}>New high score achieved</Text>
              <Text style={styles.activityTime}>Yesterday</Text>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="people" size={20} color="#3b82f6" />
              <Text style={styles.activityText}>Multiplayer game won</Text>
              <Text style={styles.activityTime}>3 days ago</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Medium',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
    fontFamily: 'Inter-Bold',
  },
  userInfo: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontFamily: 'Inter-Regular',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  winnerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
  },
  winnerImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f3f4f6',
  },
  winnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fffbeb',
  },
  winnerIcon: {
    marginRight: 12,
  },
  winnerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
  },
  winnerSubtitle: {
    fontSize: 12,
    color: '#b45309',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  quickActionItem: {
    flex: 1,
  },
  quickActionGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  pinQuizCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
  },
  pinQuizGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  pinQuizTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  pinQuizTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  pinQuizDesc: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  categoriesGrid: {
    gap: 12,
  },
  categoryCard: {
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
  categoryIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryQuestionCount: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  activityCard: {
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
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    fontFamily: 'Inter-Regular',
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'Inter-Regular',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 14,
    color: '#db2777',
    fontFamily: 'Inter-SemiBold',
  },
  categoryGradient: {
    padding: 16,
    borderRadius: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionCountBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  questionCountText: {
    fontSize: 12,
    color: '#4b5563',
    fontFamily: 'Inter-Medium',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    fontFamily: 'Inter-Bold',
  },
});

export default HomeScreen;



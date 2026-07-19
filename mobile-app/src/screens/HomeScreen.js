import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import AppBanner from '../components/AppBanner';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [activeWinners, setActiveWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // States for features
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [largeImageUrl, setLargeImageUrl] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Comments and News states (Feedback removed from dashboard)
  const [recentComments, setRecentComments] = useState([]);
  const [news, setNews] = useState([]);

  const flatListRef = useRef(null);
  const slideInterval = useRef(null);
  const tickerRef = useRef(null);
  const tickerScrollX = useRef(0);

  // Animations
  const headerLogoFloat = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadData();
  }, []);

  // Handle auto-rotate for Glimpse of the Champions slider
  useEffect(() => {
    if (activeWinners && activeWinners.length > 1) {
      slideInterval.current = setInterval(() => {
        const nextIndex = (currentIndex + 1) % activeWinners.length;
        setCurrentIndex(nextIndex);
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      }, 3000);
    }
    return () => {
      if (slideInterval.current) clearInterval(slideInterval.current);
    };
  }, [currentIndex, activeWinners]);

  // Handle auto-scroll for News Ticker
  useEffect(() => {
    let tickerInterval = null;
    if (news && news.length > 0) {
      tickerInterval = setInterval(() => {
        tickerScrollX.current += 1.5;
        tickerRef.current?.scrollTo({ x: tickerScrollX.current, animated: true });
        
        // Loop back to start if it rolls past estimated total content width
        const totalEstimatedWidth = width * 0.85 * news.length;
        if (tickerScrollX.current > totalEstimatedWidth) {
          tickerScrollX.current = -50; 
        }
      }, 70);
    }
    return () => {
      if (tickerInterval) clearInterval(tickerInterval);
    };
  }, [news]);

  // Floating Logo animation loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(headerLogoFloat, {
          toValue: -6,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(headerLogoFloat, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  // Sparkling Pulse animation for i-Genius/i-Challenge Button
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, winnersRes, commentsRes, newsRes] = await Promise.all([
        axios.get(`${API_URL}/api/categories`),
        axios.get(`${API_URL}/api/winners/active`),
        axios.get(`${API_URL}/api/comments`),
        axios.get(`${API_URL}/api/news`)
      ]);
      setCategories(categoriesRes.data);
      setActiveWinners(Array.isArray(winnersRes.data) ? winnersRes.data : (winnersRes.data ? [winnersRes.data] : []));
      setRecentComments(commentsRes.data || []);
      setNews(newsRes.data || []);
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

  const renderWinnerItem = ({ item }) => (
    <TouchableOpacity
      style={styles.winnerCard}
      onPress={() => setLargeImageUrl(item.imageUrl)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.winnerImage} />
      <View style={styles.winnerInfo}>
        <Ionicons name="trophy" size={24} color="#f59e0b" style={styles.winnerIcon} />
        <View>
          <Text style={styles.winnerTitle}>{item.title}</Text>
          <Text style={styles.winnerSubtitle}>{item.month} {item.year}</Text>
        </View>
      </View>
    </TouchableOpacity>
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
        {/* Top bar with menu and double-sized floating logos */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setIsMenuOpen(true)} style={styles.menuIconContainer}>
            <Ionicons name="menu" size={32} color="white" />
          </TouchableOpacity>

          <Animated.View style={[styles.logosContainer, { transform: [{ translateY: headerLogoFloat }] }]}>
            <Image source={require('../../assets/logo2.png')} style={styles.logoApp} />
            <Image source={require('../../assets/hilton.png')} style={styles.logoHilton} />
          </Animated.View>

          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarMiniContainer}>
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.avatarMini} />
            ) : (
              <View style={styles.avatarMiniFallback}>
                <Text style={styles.avatarMiniText}>
                  {user?.doctorName?.charAt(0)?.toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Doctor Name, Hospital & Tagline (Rearranged: Hospital then Tagline) */}
        <View style={styles.headerContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeText}>Welcome,</Text>
            <Text style={styles.userName}>Dr. {user?.doctorName}</Text>
            {user?.hospitalName ? <Text style={styles.userHospital}>{user.hospitalName}</Text> : null}
            <Text style={styles.tagline}>Transforming Learners Into Scholars</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.totalPoints || 0}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Main dashboard body, shifted downside (marginTop: 10) */}
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
              onPress={() => navigation.navigate('Categories')}
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

            {/* i-Challenge Button with sparkling scales and sparkles icon */}
            <Animated.View style={[styles.quickActionItem, { transform: [{ scale: pulseScale }] }]}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => navigation.navigate('Competition')}
              >
                <LinearGradient colors={['#d946ef', '#c026d3']} style={styles.quickActionGradient}>
                  <Ionicons name="sparkles" size={24} color="#facc15" />
                  <Text style={styles.quickActionText} numberOfLines={1}>✨ i-Challenge ✨</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Glimpse of the Champions (Slider) */}
        {activeWinners && activeWinners.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Glimpse of the Champions</Text>
            <FlatList
              ref={flatListRef}
              data={activeWinners}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderWinnerItem}
              snapToAlignment="center"
              decelerationRate="fast"
              snapToInterval={width * 0.8 + 20}
              onScrollToIndexFailed={(info) => {
                const offset = info.highestMeasuredFrameIndex * (width * 0.8 + 20);
                flatListRef.current?.scrollToOffset({ offset, animated: true });
              }}
            />
          </View>
        )}

        {/* News Ticker Section */}
        {news && news.length > 0 && (
          <View style={styles.tickerSection}>
            <View style={styles.tickerHeader}>
              <Ionicons name="megaphone" size={14} color="#4c1d95" />
              <Text style={styles.tickerTitle}>NEWS</Text>
            </View>
            <View style={styles.tickerContainer}>
              <ScrollView
                ref={tickerRef}
                horizontal
                scrollEnabled={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tickerScroll}
              >
                {news.map((item, index) => (
                  <View key={item.id} style={styles.tickerItem}>
                    <Text style={styles.tickerText}>
                      📢 <Text style={{ fontWeight: 'bold', color: '#1e1b4b' }}>{item.title}</Text>: {item.content}
                    </Text>
                    {index < news.length - 1 && <Text style={styles.tickerSeparator}> • </Text>}
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* 1st Banner Ad just after News Section */}
        <View style={styles.bannerContainer}>
          <AppBanner location="dashboard_middle" />
        </View>

        {/* Clash of Titans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clash of Titans</Text>
          <TouchableOpacity
            style={styles.pinQuizCard}
            onPress={() => navigation.navigate('WardActivities')}
          >
            <LinearGradient colors={['#6d28d9', '#5b21b6']} style={styles.pinQuizGradient}>
              <Ionicons name="medical" size={32} color="white" />
              <View style={styles.pinQuizTextContainer}>
                <Text style={styles.pinQuizTitle}>Clash of Titans</Text>
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

        {/* Comments Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discussion & Comments</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#6d28d9" style={{ marginVertical: 10 }} />
          ) : recentComments.length === 0 ? (
            <View style={styles.emptyItemsCard}>
              <Ionicons name="chatbox-outline" size={24} color="#9ca3af" />
              <Text style={styles.emptyItemsText}>No comments have been posted yet.</Text>
            </View>
          ) : (
            <View style={styles.commentsContainer}>
              {recentComments.map((comment) => (
                <View key={comment.id} style={styles.commentItemCard}>
                  <View style={styles.commentItemHeader}>
                    {comment.user?.profilePicture ? (
                      <Image source={{ uri: comment.user.profilePicture }} style={styles.commentAvatar} />
                    ) : (
                      <View style={styles.commentAvatarFallback}>
                        <Text style={styles.commentAvatarText}>
                          {comment.user?.doctorName?.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.commentDoctorName}>Dr. {comment.user?.doctorName}</Text>
                      <Text style={styles.commentTargetName}>
                        {comment.targetType === 'quiz' ? 'Quiz: ' : 'Material: '}
                        <Text style={{ fontWeight: '600' }}>{comment.targetName}</Text>
                      </Text>
                    </View>
                    <Text style={styles.commentTime}>
                      {new Date(comment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={styles.commentBodyText}>"{comment.content}"</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 2nd Banner Ad after Discussion and Comments Section */}
        <View style={styles.bannerContainer}>
          <AppBanner location="dashboard_footer" />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Hamburger Drawer Menu Modal */}
      <Modal
        visible={isMenuOpen}
        transparent={true}
        animationType="none"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <View style={styles.drawerOverlay}>
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={() => setIsMenuOpen(false)}
          />

          <LinearGradient
            colors={['#1e1b4b', '#311066']}
            style={styles.drawerContent}
          >
            <View style={styles.drawerHeader}>
              <View style={styles.drawerLogos}>
                <Image source={require('../../assets/logo2.png')} style={styles.drawerLogoApp} />
                <Image source={require('../../assets/hilton.png')} style={styles.drawerLogoHilton} />
              </View>
              <TouchableOpacity onPress={() => setIsMenuOpen(false)} style={styles.drawerCloseButton}>
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.drawerUserSection}>
              {user?.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={styles.drawerAvatar} />
              ) : (
                <View style={styles.drawerAvatarFallback}>
                  <Text style={styles.drawerAvatarText}>
                    {user?.doctorName?.charAt(0)?.toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.drawerUserName}>Dr. {user?.doctorName}</Text>
                <Text style={styles.drawerUserSub}>Score: {user?.totalPoints || 0}</Text>
              </View>
            </View>

            <View style={styles.drawerDivider} />

            <ScrollView style={styles.drawerMenuList}>
              {[
                { name: 'Home', icon: 'home', action: () => navigation.navigate('Home') },
                { name: 'i-Challenge', icon: 'calendar', action: () => navigation.navigate('Competition') },
                { name: 'Clash of Titans', icon: 'medical', action: () => navigation.navigate('WardActivities') },
                { name: 'Single Player', icon: 'person', action: () => navigation.navigate('Categories') },
                { name: 'Multiplayer', icon: 'people', action: () => navigation.navigate('Multiplayer') },
                { name: 'Leaderboard', icon: 'trophy', action: () => navigation.navigate('Leaderboard') },
                { name: 'Study Guides', icon: 'book', action: () => navigation.navigate('StudyGuides') },
                { name: 'Support', icon: 'help-circle', action: () => navigation.navigate('Support') },
                { name: 'Profile', icon: 'person-circle', action: () => navigation.navigate('Profile') },
              ].map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={styles.drawerMenuItem}
                  onPress={() => {
                    setIsMenuOpen(false);
                    item.action();
                  }}
                >
                  <Ionicons name={item.icon} size={22} color="white" style={styles.drawerMenuIcon} />
                  <Text style={styles.drawerMenuItemText}>{item.name}</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.drawerDivider} />

              <TouchableOpacity
                style={styles.drawerMenuItem}
                onPress={() => {
                  setIsMenuOpen(false);
                  logout();
                }}
              >
                <Ionicons name="log-out" size={22} color="#f87171" style={styles.drawerMenuIcon} />
                <Text style={[styles.drawerMenuItemText, { color: '#f87171' }]}>Logout</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Added Banner Ad on Hamburger Menu Footer */}
            <View style={styles.drawerBanner}>
              <AppBanner location="sidebar" />
            </View>
          </LinearGradient>
        </View>
      </Modal>

      {/* Large Image Viewer Modal */}
      {largeImageUrl && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setLargeImageUrl(null)}
        >
          <TouchableOpacity
            style={styles.largeImageOverlay}
            activeOpacity={1}
            onPress={() => setLargeImageUrl(null)}
          >
            <TouchableOpacity
              style={styles.largeImageCloseButton}
              onPress={() => setLargeImageUrl(null)}
            >
              <Ionicons name="close" size={32} color="white" />
            </TouchableOpacity>
            <Image source={{ uri: largeImageUrl }} style={styles.largeImage} resizeMode="contain" />
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { 
    paddingTop: 60, 
    paddingBottom: 35, 
    paddingHorizontal: 20, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30 
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  menuIconContainer: { padding: 4 },
  logosContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, justifyContent: 'center' },
  logoApp: { width: 90, height: 70, resizeMode: 'contain' },
  logoHilton: { width: 110, height: 60, resizeMode: 'contain' },
  avatarMiniContainer: { padding: 2 },
  avatarMini: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: 'white' },
  avatarMiniFallback: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'white' },
  avatarMiniText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 },
  welcomeText: { fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'Inter-Medium' },
  userName: { fontSize: 22, fontWeight: 'bold', color: 'white', fontFamily: 'Inter-Bold', marginTop: 2 },
  tagline: { fontSize: 12, color: '#facc15', fontFamily: 'Inter-SemiBold', marginTop: 8, fontStyle: 'italic' },
  userHospital: { fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter-Regular', marginTop: 4 },
  
  statsContainer: { marginLeft: 15 },
  statItem: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, minWidth: 70 },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: 'white', fontFamily: 'Inter-Bold' },
  statLabel: { fontSize: 11, color: 'rgba(255, 255, 255, 0.9)', fontFamily: 'Inter-Medium', marginTop: 2 },
  
  content: { flex: 1, marginTop: 10 },
  section: { padding: 20, paddingBottom: 0 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  
  winnerCard: { width: width * 0.8, backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, marginRight: 20, marginBottom: 10 },
  winnerImage: { width: '100%', height: 180, backgroundColor: '#f3f4f6' },
  winnerInfo: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fffbeb' },
  winnerIcon: { marginRight: 12 },
  winnerTitle: { fontSize: 15, fontWeight: 'bold', color: '#92400e', fontFamily: 'Inter-Bold' },
  winnerSubtitle: { fontSize: 11, color: '#b45309', marginTop: 2, fontFamily: 'Inter-Regular' },
  
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  quickActionItem: { width: '48%', marginBottom: 10 },
  quickActionGradient: { padding: 16, borderRadius: 16, alignItems: 'center', gap: 8, minHeight: 80, justifyContent: 'center' },
  quickActionText: { color: 'white', fontSize: 13, fontWeight: '600', fontFamily: 'Inter-SemiBold', textAlign: 'center' },
  
  pinQuizCard: { borderRadius: 16, overflow: 'hidden' },
  pinQuizGradient: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  pinQuizTextContainer: { flex: 1, marginLeft: 16 },
  pinQuizTitle: { color: 'white', fontSize: 17, fontWeight: 'bold', fontFamily: 'Inter-Bold' },
  pinQuizDesc: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 13, marginTop: 4, fontFamily: 'Inter-Regular' },
  
  bannerContainer: { marginTop: 20, borderRadius: 16, overflow: 'hidden', marginHorizontal: 20 },

  // News Ticker styles
  tickerSection: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#fef08a',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fde047',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#facc15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
    gap: 4
  },
  tickerTitle: {
    color: '#4c1d95',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  tickerContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  tickerScroll: {
    alignItems: 'center',
  },
  tickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tickerText: {
    color: '#854d0e',
    fontSize: 12.5,
    fontFamily: 'Inter-Medium',
  },
  tickerSeparator: {
    color: '#ca8a04',
    fontSize: 14,
    marginHorizontal: 10,
    fontWeight: 'bold',
  },

  // Drawer styles
  drawerOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)' },
  drawerBackdrop: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 },
  drawerContent: { width: width * 0.78, height: '100%', padding: 24, paddingTop: 60 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  drawerLogos: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  drawerLogoApp: { width: 40, height: 35, resizeMode: 'contain' },
  drawerLogoHilton: { width: 55, height: 28, resizeMode: 'contain' },
  drawerCloseButton: { padding: 4 },
  drawerUserSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  drawerAvatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: 'white' },
  drawerAvatarFallback: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'white' },
  drawerAvatarText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  drawerUserName: { color: 'white', fontSize: 18, fontWeight: 'bold', fontFamily: 'Inter-Bold' },
  drawerUserSub: { color: '#fbbf24', fontSize: 13, fontFamily: 'Inter-Medium', marginTop: 2 },
  drawerDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 15 },
  drawerMenuList: { flex: 1 },
  drawerMenuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4, gap: 12 },
  drawerMenuIcon: { width: 24, textAlign: 'center' },
  drawerMenuItemText: { color: 'white', fontSize: 15, fontFamily: 'Inter-Medium' },
  drawerBanner: {
    marginTop: 'auto',
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)'
  },

  // Large image preview styles
  largeImageOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  largeImageCloseButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
  largeImage: { width: width * 0.95, height: height * 0.8 },

  // Empty items styling
  emptyItemsCard: { padding: 24, backgroundColor: 'white', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#d1d5db' },
  emptyItemsText: { color: '#9ca3af', fontSize: 14, marginTop: 8, textAlign: 'center', fontFamily: 'Inter-Regular' },

  // Comments List styling
  commentsContainer: { gap: 12 },
  commentItemCard: { backgroundColor: 'white', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  commentItemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18 },
  commentAvatarFallback: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  commentAvatarText: { color: '#1e3a8a', fontSize: 16, fontWeight: 'bold' },
  commentDoctorName: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
  commentTargetName: { fontSize: 11, color: '#6b7280', marginTop: 1 },
  commentTime: { fontSize: 11, color: '#9ca3af' },
  commentBodyText: { fontSize: 13, color: '#4b5563', lineHeight: 18, fontStyle: 'italic' },
});

export default HomeScreen;

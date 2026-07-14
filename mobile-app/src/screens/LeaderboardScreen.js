import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Image,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

const { width } = Dimensions.get('window');

const LeaderboardScreen = ({ navigation }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState('All Time'); // Today, Weekly, All Time
  
  // Filters state
  const [mode, setMode] = useState('');
  const [designation, setDesignation] = useState('');
  const [city, setCity] = useState('');
  const [hospital, setHospital] = useState('');
  const [quizName, setQuizName] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (mode) params.append('mode', mode);
      if (designation) params.append('designation', designation);
      if (city) params.append('city', city);
      if (hospital) params.append('hospital', hospital);
      if (quizName) params.append('quizName', quizName);

      const response = await axios.get(`${API_URL}/api/users/leaderboard?${params.toString()}`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setShowFilters(false);
    loadLeaderboard();
  };

  const clearFilters = () => {
    setMode('');
    setDesignation('');
    setCity('');
    setHospital('');
    setQuizName('');
    setTimeout(() => {
      setShowFilters(false);
      axios.get(`${API_URL}/api/users/leaderboard`).then(res => setLeaderboard(res.data)).catch(console.error);
    }, 0);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const getRankStyles = (index) => {
    switch (index) {
      case 0: return { bg: '#6d28d9', text: 'white' }; // 1st
      case 1: return { bg: '#8b5cf6', text: 'white' }; // 2nd
      case 2: return { bg: '#ddd6fe', text: '#1f2937' }; // 3rd
      default: return { bg: 'white', text: '#1f2937' }; // 4th+
    }
  };

  const renderLeaderboardItem = ({ item, index }) => {
    const { bg, text } = getRankStyles(index);
    const isTopThree = index < 3;
    
    return (
      <View style={[styles.leaderboardItem, { backgroundColor: bg }]}>
        <Text style={[styles.listRankNumber, { color: text }]}>{index + 1}</Text>
        
        <View style={styles.listAvatarContainer}>
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.listAvatar} />
          ) : (
            <View style={styles.listAvatarFallback}>
              <Text style={styles.listAvatarFallbackText}>{item.doctorName?.charAt(0)}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.listUserName, { color: text }]} numberOfLines={1}>
          {item.doctorName}
        </Text>
        
        <Ionicons name="trophy" size={16} color="#f97316" style={{ marginHorizontal: 8 }} />
        
        <View style={styles.listScorePill}>
          <Ionicons name="diamond" size={12} color="#f97316" />
          <Text style={styles.listScoreText}>{item.totalPoints || 0}</Text>
        </View>
      </View>
    );
  };

  const renderPodium = () => {
    if (leaderboard.length < 3) return null;
    const top3 = leaderboard.slice(0, 3);
    
    return (
      <View style={styles.podiumContainer}>
        {/* Rank 2 (Left) */}
        <View style={styles.podiumItemSide}>
          <View style={[styles.podiumAvatarWrap, { borderColor: '#22c55e' }]}>
             {top3[1].profilePicture ? (
                <Image source={{ uri: top3[1].profilePicture }} style={styles.podiumAvatarSide} />
              ) : (
                <View style={styles.podiumAvatarFallbackSide}><Text style={{fontSize:20, color:'#555'}}>{top3[1].doctorName?.charAt(0)}</Text></View>
              )}
             <View style={[styles.podiumRankBadge, { backgroundColor: '#22c55e' }]}><Text style={styles.podiumRankText}>2</Text></View>
          </View>
          <Text style={styles.podiumName} numberOfLines={1}>{top3[1].doctorName.split(' ')[0]}</Text>
          <View style={[styles.podiumScorePill, { backgroundColor: '#22c55e' }]}>
            <Ionicons name="diamond" size={12} color="white" />
            <Text style={styles.podiumScoreText}>{top3[1].totalPoints || 0}</Text>
          </View>
        </View>

        {/* Rank 1 (Center) */}
        <View style={styles.podiumItemCenter}>
          <Ionicons name="star" size={32} color="#facc15" style={styles.crownIcon} />
          <View style={[styles.podiumAvatarWrapCenter, { borderColor: '#f97316' }]}>
             {top3[0].profilePicture ? (
                <Image source={{ uri: top3[0].profilePicture }} style={styles.podiumAvatarCenter} />
              ) : (
                <View style={styles.podiumAvatarFallbackCenter}><Text style={{fontSize:28, color:'#555'}}>{top3[0].doctorName?.charAt(0)}</Text></View>
              )}
             <View style={[styles.podiumRankBadgeCenter, { backgroundColor: '#f97316' }]}><Text style={styles.podiumRankText}>1</Text></View>
          </View>
          <Text style={styles.podiumNameCenter} numberOfLines={1}>{top3[0].doctorName.split(' ')[0]}</Text>
          <View style={[styles.podiumScorePill, { backgroundColor: '#f97316' }]}>
            <Ionicons name="diamond" size={12} color="white" />
            <Text style={styles.podiumScoreText}>{top3[0].totalPoints || 0}</Text>
          </View>
        </View>

        {/* Rank 3 (Right) */}
        <View style={styles.podiumItemSide}>
          <View style={[styles.podiumAvatarWrap, { borderColor: '#8b5cf6' }]}>
             {top3[2].profilePicture ? (
                <Image source={{ uri: top3[2].profilePicture }} style={styles.podiumAvatarSide} />
              ) : (
                <View style={styles.podiumAvatarFallbackSide}><Text style={{fontSize:20, color:'#555'}}>{top3[2].doctorName?.charAt(0)}</Text></View>
              )}
             <View style={[styles.podiumRankBadge, { backgroundColor: '#8b5cf6' }]}><Text style={styles.podiumRankText}>3</Text></View>
          </View>
          <Text style={styles.podiumName} numberOfLines={1}>{top3[2].doctorName.split(' ')[0]}</Text>
          <View style={[styles.podiumScorePill, { backgroundColor: '#8b5cf6' }]}>
            <Ionicons name="diamond" size={12} color="white" />
            <Text style={styles.podiumScoreText}>{top3[2].totalPoints || 0}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4c1d95', '#6d28d9', '#8b5cf6']}
        style={styles.headerBackground}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Leaderboard</Text>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterBtn}>
            <Ionicons name="filter" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Time Filters */}
        <View style={styles.timeFilterContainer}>
          {['Today', 'Weekly', 'All Time'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              style={[styles.timeFilterTab, timeFilter === tab && styles.timeFilterTabActive]}
              onPress={() => setTimeFilter(tab)}
            >
              <Text style={[styles.timeFilterText, timeFilter === tab && styles.timeFilterTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderPodium()}
        
      </LinearGradient>

      {/* Advanced Filters */}
      {showFilters && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Filter Rankings</Text>
          <View style={styles.filterRow}>
            <TextInput style={styles.filterInput} placeholder="City" value={city} onChangeText={setCity} />
            <TextInput style={styles.filterInput} placeholder="Hospital" value={hospital} onChangeText={setHospital} />
          </View>
          <View style={styles.filterRow}>
            <TextInput style={styles.filterInput} placeholder="Designation" value={designation} onChangeText={setDesignation} />
            <TextInput style={styles.filterInput} placeholder="Category" value={quizName} onChangeText={setQuizName} />
          </View>
          <View style={styles.modeContainer}>
            <TouchableOpacity style={[styles.modeBtn, mode === 'single' && styles.modeBtnActive]} onPress={() => setMode(mode === 'single' ? '' : 'single')}><Text style={[styles.modeBtnText, mode === 'single' && styles.modeBtnTextActive]}>Single</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.modeBtn, mode === 'multiplayer' && styles.modeBtnActive]} onPress={() => setMode(mode === 'multiplayer' ? '' : 'multiplayer')}><Text style={[styles.modeBtnText, mode === 'multiplayer' && styles.modeBtnTextActive]}>Multi</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.modeBtn, mode === 'pin' && styles.modeBtnActive]} onPress={() => setMode(mode === 'pin' ? '' : 'pin')}><Text style={[styles.modeBtnText, mode === 'pin' && styles.modeBtnTextActive]}>Ward</Text></TouchableOpacity>
          </View>
          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}><Text style={styles.clearBtnText}>Clear</Text></TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}><Text style={styles.applyBtnText}>Apply</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderLeaderboardItem}
          keyExtractor={(item, index) => item.id + index.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6d28d9" />}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={leaderboard.length < 3 ? null : <View style={{ height: 10 }} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerBackground: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeBtn: {
    backgroundColor: 'white',
    width: 36, height: 36,
    borderRadius: 18,
    alignItems: 'center', justifyContent: 'center'
  },
  filterBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  title: {
    fontSize: 22, color: 'white', fontWeight: 'bold', fontFamily: 'Inter-Bold'
  },
  timeFilterContainer: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20, padding: 4, marginBottom: 20
  },
  timeFilterTab: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 16
  },
  timeFilterTabActive: { backgroundColor: 'white' },
  timeFilterText: { color: 'white', fontWeight: '600', fontSize: 13, fontFamily: 'Inter-SemiBold' },
  timeFilterTextActive: { color: '#6d28d9' },
  
  // Podium Styles
  podiumContainer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end',
    height: 180, marginBottom: 10
  },
  podiumItemSide: { alignItems: 'center', width: width * 0.28, marginBottom: 10 },
  podiumItemCenter: { alignItems: 'center', width: width * 0.34, zIndex: 10 },
  podiumAvatarWrap: {
    width: 70, height: 70, borderRadius: 35, borderWidth: 3,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginBottom: 8
  },
  podiumAvatarSide: { width: 64, height: 64, borderRadius: 32 },
  podiumAvatarFallbackSide: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f1f5f9', alignItems:'center', justifyContent:'center' },
  podiumRankBadge: {
    position: 'absolute', bottom: -10, width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white'
  },
  podiumRankText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  podiumAvatarWrapCenter: {
    width: 90, height: 90, borderRadius: 45, borderWidth: 4,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginBottom: 8
  },
  podiumAvatarCenter: { width: 82, height: 82, borderRadius: 41 },
  podiumAvatarFallbackCenter: { width: 82, height: 82, borderRadius: 41, backgroundColor: '#f1f5f9', alignItems:'center', justifyContent:'center' },
  podiumRankBadgeCenter: {
    position: 'absolute', bottom: -12, width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white'
  },
  crownIcon: { position: 'absolute', top: -35, zIndex: 20 },
  podiumName: { color: 'white', fontSize: 14, fontWeight: 'bold', marginBottom: 6, fontFamily: 'Inter-Bold' },
  podiumNameCenter: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 8, fontFamily: 'Inter-Bold' },
  podiumScorePill: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 12
  },
  podiumScoreText: { color: 'white', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },

  // List Styles
  listContent: { paddingHorizontal: 20, paddingBottom: 30 },
  leaderboardItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  listRankNumber: { width: 30, fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter-Bold' },
  listAvatarContainer: { marginRight: 12 },
  listAvatar: { width: 44, height: 44, borderRadius: 22 },
  listAvatarFallback: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  listAvatarFallbackText: { fontSize: 18, color: '#64748b', fontWeight: 'bold' },
  listUserName: { flex: 1, fontSize: 15, fontWeight: '600', fontFamily: 'Inter-SemiBold' },
  listScorePill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1
  },
  listScoreText: { fontSize: 13, fontWeight: 'bold', color: '#1f2937', marginLeft: 4, fontFamily: 'Inter-Bold' },

  // Filter Styles
  filterContainer: {
    backgroundColor: 'white', marginHorizontal: 20, marginTop: -20, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, zIndex: 10
  },
  filterTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#1f2937' },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  filterInput: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, padding: 10, marginHorizontal: 4, fontSize: 14 },
  modeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 4, marginBottom: 16, marginTop: 6 },
  modeBtn: { flex: 1, backgroundColor: '#f3f4f6', paddingVertical: 8, marginHorizontal: 4, borderRadius: 8, alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#6d28d9' },
  modeBtnText: { color: '#6b7280', fontWeight: '600', fontSize: 13 },
  modeBtnTextActive: { color: 'white' },
  filterActions: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 4 },
  clearBtn: { flex: 1, paddingVertical: 10, marginRight: 6, borderRadius: 8, alignItems: 'center', backgroundColor: '#fee2e2' },
  clearBtnText: { color: '#ef4444', fontWeight: 'bold' },
  applyBtn: { flex: 1, paddingVertical: 10, marginLeft: 6, borderRadius: 8, alignItems: 'center', backgroundColor: '#6d28d9' },
  applyBtnText: { color: 'white', fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#6b7280', fontFamily: 'Inter-Medium' }
});

export default LeaderboardScreen;

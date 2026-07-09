import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

const LeaderboardScreen = ({ navigation }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters state
  const [mode, setMode] = useState(''); // 'single', 'multiplayer', 'pin'
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
    // Notice we don't call loadLeaderboard immediately because state updates are async
    // But we can trigger it in a slight timeout or just rely on a separate effect (or just call it with empty params directly)
    setTimeout(() => {
      setShowFilters(false);
      // Hack to reload without state
      axios.get(`${API_URL}/api/users/leaderboard`).then(res => setLeaderboard(res.data)).catch(console.error);
    }, 0);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return { name: 'trophy', color: '#fbbf24' };
      case 1:
        return { name: 'medal', color: '#9ca3af' };
      case 2:
        return { name: 'medal', color: '#f59e0b' };
      default:
        return { name: 'person', color: '#6b7280' };
    }
  };

  const renderLeaderboardItem = ({ item, index }) => {
    const rankIcon = getRankIcon(index);
    
    return (
      <View style={styles.leaderboardItem}>
        <View style={styles.rankContainer}>
          <Ionicons name={rankIcon.name} size={24} color={rankIcon.color} />
          <Text style={styles.rankNumber}>{index + 1}</Text>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Dr. {item.doctorName}</Text>
          <Text style={styles.userDetails}>
            {item.specialty} • {item.hospitalName}
          </Text>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>{item.totalPoints}</Text>
          <Text style={styles.scoreLabel}>points</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#db2777', '#9d174d']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Ionicons name="trophy" size={32} color="white" />
            <Text style={styles.title}>Leaderboard</Text>
            <Text style={styles.subtitle}>Top performers</Text>
          </View>
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#db2777', '#9d174d']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={{ width: 32 }} />
          <View style={styles.headerContent}>
            <Ionicons name="trophy" size={32} color="white" />
            <Text style={styles.title}>Leaderboard</Text>
            <Text style={styles.subtitle}>Top performers</Text>
          </View>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterBtn}>
            <Ionicons name="filter" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {showFilters && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Filter Rankings</Text>
          
          <View style={styles.filterRow}>
            <TextInput
              style={styles.filterInput}
              placeholder="City"
              value={city}
              onChangeText={setCity}
            />
            <TextInput
              style={styles.filterInput}
              placeholder="Hospital"
              value={hospital}
              onChangeText={setHospital}
            />
          </View>

          <View style={styles.filterRow}>
            <TextInput
              style={styles.filterInput}
              placeholder="Designation"
              value={designation}
              onChangeText={setDesignation}
            />
            <TextInput
              style={styles.filterInput}
              placeholder="Category / Ward Name"
              value={quizName}
              onChangeText={setQuizName}
            />
          </View>

          <View style={styles.modeContainer}>
            <TouchableOpacity 
              style={[styles.modeBtn, mode === 'single' && styles.modeBtnActive]}
              onPress={() => setMode(mode === 'single' ? '' : 'single')}
            >
              <Text style={[styles.modeBtnText, mode === 'single' && styles.modeBtnTextActive]}>Single</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modeBtn, mode === 'multiplayer' && styles.modeBtnActive]}
              onPress={() => setMode(mode === 'multiplayer' ? '' : 'multiplayer')}
            >
              <Text style={[styles.modeBtnText, mode === 'multiplayer' && styles.modeBtnTextActive]}>Multi</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modeBtn, mode === 'pin' && styles.modeBtnActive]}
              onPress={() => setMode(mode === 'pin' ? '' : 'pin')}
            >
              <Text style={[styles.modeBtnText, mode === 'pin' && styles.modeBtnTextActive]}>Ward</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
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
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerContent: {
    alignItems: 'center',
    flex: 1,
  },
  filterBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Medium',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  leaderboardItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankContainer: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 40,
  },
  rankNumber: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontFamily: 'Inter-Medium',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  userDetails: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
    fontFamily: 'Inter-Bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Inter-Medium',
  },
  filterContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -10,
    marginBottom: 10,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1f2937',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  filterInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 4,
    fontSize: 14,
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 4,
    marginBottom: 16,
    marginTop: 6,
  },
  modeBtn: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#3b82f6',
  },
  modeBtnText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 13,
  },
  modeBtnTextActive: {
    color: 'white',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 4,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 10,
    marginRight: 6,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fee2e2',
  },
  clearBtnText: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  applyBtn: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 6,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
  },
  applyBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default LeaderboardScreen;



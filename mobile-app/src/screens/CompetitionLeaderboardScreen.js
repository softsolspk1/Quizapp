import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { API_URL } from '../config';

const CompetitionLeaderboardScreen = ({ navigation, route }) => {
  const { competition } = route.params;
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  
  const specialties = ['Cardiology', 'Dermatology', 'Endocrinology & Diabetes', 'ER', 'Gastroenterology', 'Gynaecology', 'Internal Medicine', 'Nephrology', 'Neurology', 'Orthopaedic', 'Paediatrics', 'Psychiatry', 'Pulmonology'];
  const cities = ['Abbottabad', 'Bahawalpur', 'Chiniot', 'Dera Ghazi Khan', 'Dera Ismail Khan', 'Faisalabad', 'Gilgit', 'Gujranwala', 'Gujrat', 'Hyderabad', 'Islamabad', 'Jacobabad', 'Jhang', 'Jhelum', 'Karachi', 'Kasur', 'Khairpur', 'Lahore', 'Larkana', 'Mardan', 'Mingora', 'Mirpur Khas', 'Multan', 'Muzaffarabad', 'Nawabshah', 'Okara', 'Peshawar', 'Quetta', 'Rahim Yar Khan', 'Rawalpindi', 'Sadiqabad', 'Sahiwal', 'Sargodha', 'Sheikhupura', 'Shikarpur', 'Sialkot', 'Sukkur', 'Vehari'];

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedSpecialty, selectedCity]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      let query = `?`;
      if (selectedSpecialty) query += `specialty=${encodeURIComponent(selectedSpecialty)}&`;
      if (selectedCity) query += `city=${encodeURIComponent(selectedCity)}`;

      const response = await axios.get(`${API_URL}/api/competitions/${competition.id}/leaderboard${query}`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('UserProfile', { userId: item.user.id })}
    >
      <View style={styles.rankContainer}>
        {index < 3 ? (
          <Ionicons 
            name="trophy" 
            size={24} 
            color={index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : '#b45309'} 
          />
        ) : (
          <Text style={styles.rankText}>#{index + 1}</Text>
        )}
      </View>
      {item.user.profilePicture ? (
        <Image source={{ uri: item.user.profilePicture }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="person" size={24} color="#9ca3af" />
        </View>
      )}
      <View style={styles.infoContainer}>
        <Text style={styles.nameText}>{item.user.doctorName}</Text>
        <Text style={styles.detailsText}>{item.user.specialty} • {item.user.city}</Text>
        <Text style={styles.detailsText}>{item.user.hospitalName}</Text>
      </View>
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>{item.score}</Text>
        <Text style={styles.pointsLabel}>Score</Text>
        <Text style={styles.timeText}>{item.timeSpent}s</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1e1b4b', '#4c1d95', '#6d28d9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Scoreboard</Text>
          <Text style={styles.subtitle}>{competition.name}</Text>
        </View>
      </LinearGradient>

      <View style={styles.filterSection}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedSpecialty}
            onValueChange={(val) => setSelectedSpecialty(val)}
            style={styles.picker}
          >
            <Picker.Item label="All Specialties" value="" />
            {specialties.map(s => <Picker.Item key={s} label={s} value={s} />)}
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCity}
            onValueChange={(val) => setSelectedCity(val)}
            style={styles.picker}
          >
            <Picker.Item label="All Cities" value="" />
            {cities.map(c => <Picker.Item key={c} label={c} value={c} />)}
          </Picker>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6d28d9" style={{ marginTop: 40 }} />
      ) : leaderboard.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="podium-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyText}>No rankings found for the selected filters.</Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 24, alignItems: 'center' },
  backButton: { position: 'absolute', top: 50, left: 24, zIndex: 1, padding: 8 },
  headerContent: { alignItems: 'center', marginTop: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', fontFamily: 'Inter-Bold' },
  subtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter-Medium', marginTop: 4 },
  filterSection: { flexDirection: 'row', padding: 12, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#e5e7eb', gap: 8 },
  pickerContainer: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, height: 40, justifyContent: 'center' },
  picker: { height: 40 },
  listContent: { padding: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyText: { color: '#6b7280', fontSize: 16, textAlign: 'center', marginTop: 16, fontFamily: 'Inter-Medium' },
  card: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  rankContainer: { width: 40, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 16, fontWeight: 'bold', color: '#6b7280', fontFamily: 'Inter-Bold' },
  avatar: { width: 48, height: 48, borderRadius: 24, marginHorizontal: 12 },
  infoContainer: { flex: 1 },
  nameText: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', fontFamily: 'Inter-SemiBold', marginBottom: 2 },
  detailsText: { fontSize: 12, color: '#6b7280', fontFamily: 'Inter-Regular' },
  scoreContainer: { alignItems: 'flex-end', minWidth: 50 },
  scoreText: { fontSize: 18, fontWeight: 'bold', color: '#6d28d9', fontFamily: 'Inter-Bold' },
  pointsLabel: { fontSize: 10, color: '#6b7280', fontFamily: 'Inter-Medium' },
  timeText: { fontSize: 11, color: '#9ca3af', fontFamily: 'Inter-Regular', marginTop: 2 }
});

export default CompetitionLeaderboardScreen;

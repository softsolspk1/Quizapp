import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const MultiplayerQuizScreen = ({ navigation, route }) => {
  const { roomId, isHost } = route.params;
  const [players, setPlayers] = useState([
    { id: '1', name: 'Dr. John Smith', isReady: true },
    { id: '2', name: 'Dr. Sarah Johnson', isReady: false },
  ]);
  const [isReady, setIsReady] = useState(false);
  const [gameStarting, setGameStarting] = useState(false);

  useEffect(() => {
    // Simulate other players joining
    const timer = setTimeout(() => {
      setPlayers(prev => [
        ...prev,
        { id: '3', name: 'Dr. Michael Brown', isReady: false }
      ]);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleReadyToggle = () => {
    setIsReady(!isReady);
  };

  const handleStartGame = () => {
    if (players.filter(p => p.isReady).length < 2) {
      Alert.alert('Not Enough Players', 'At least 2 players must be ready to start the game.');
      return;
    }

    setGameStarting(true);
    // Simulate game starting
    setTimeout(() => {
      // Navigate to quiz screen with multiplayer mode
      navigation.navigate('Quiz', {
        category: { _id: 'multiplayer', name: 'Multiplayer Quiz' },
        questions: [], // This would be loaded from API
        gameMode: 'multiplayer'
      });
    }, 3000);
  };

  const readyPlayersCount = players.filter(p => p.isReady).length;

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
          <Ionicons name="people" size={32} color="white" />
          <Text style={styles.title}>Room: {roomId}</Text>
          <Text style={styles.subtitle}>
            {isHost ? 'You are the host' : 'Waiting for host to start'}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Room Info */}
        <View style={styles.roomInfoCard}>
          <View style={styles.roomInfoHeader}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <Text style={styles.roomInfoTitle}>Room Information</Text>
          </View>
          <Text style={styles.roomInfoText}>
            Share this room ID with other players: <Text style={styles.roomId}>{roomId}</Text>
          </Text>
        </View>

        {/* Players List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Players ({players.length}/8)
          </Text>
          <View style={styles.playersList}>
            {players.map((player, index) => (
              <View key={player.id} style={styles.playerItem}>
                <View style={styles.playerInfo}>
                  <View style={styles.playerAvatar}>
                    <Text style={styles.playerInitial}>
                      {player.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.playerStatus}>
                      {player.isReady ? 'Ready' : 'Not Ready'}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.readyIndicator,
                  { backgroundColor: player.isReady ? '#10b981' : '#ef4444' }
                ]}>
                  <Ionicons 
                    name={player.isReady ? 'checkmark' : 'close'} 
                    size={16} 
                    color="white" 
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Ready Status */}
        <View style={styles.readySection}>
          <TouchableOpacity
            style={[styles.readyButton, isReady && styles.readyButtonActive]}
            onPress={handleReadyToggle}
          >
            <Ionicons 
              name={isReady ? 'checkmark-circle' : 'ellipse-outline'} 
              size={24} 
              color={isReady ? 'white' : '#3b82f6'} 
            />
            <Text style={[
              styles.readyButtonText,
              isReady && styles.readyButtonTextActive
            ]}>
              {isReady ? 'Ready' : 'Mark as Ready'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Start Game Button (Host Only) */}
        {isHost && (
          <View style={styles.startSection}>
            <TouchableOpacity
              style={[
                styles.startButton,
                readyPlayersCount < 2 && styles.startButtonDisabled
              ]}
              onPress={handleStartGame}
              disabled={readyPlayersCount < 2 || gameStarting}
            >
              <LinearGradient
                colors={readyPlayersCount >= 2 ? ['#10b981', '#059669'] : ['#9ca3af', '#6b7280']}
                style={styles.startButtonGradient}
              >
                <Text style={styles.startButtonText}>
                  {gameStarting ? 'Starting Game...' : `Start Game (${readyPlayersCount}/2)`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Game Starting Animation */}
        {gameStarting && (
          <View style={styles.startingOverlay}>
            <View style={styles.startingContent}>
              <Ionicons name="rocket" size={48} color="#3b82f6" />
              <Text style={styles.startingText}>Game Starting...</Text>
              <Text style={styles.startingSubtext}>Get ready!</Text>
            </View>
          </View>
        )}
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
    paddingBottom: 20,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Medium',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  roomInfoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roomInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 12,
    fontFamily: 'Inter-SemiBold',
  },
  roomInfoText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  roomId: {
    fontWeight: '600',
    color: '#3b82f6',
    fontFamily: 'Inter-SemiBold',
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
  playersList: {
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
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playerInitial: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    fontFamily: 'Inter-Medium',
  },
  playerStatus: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    fontFamily: 'Inter-Regular',
  },
  readyIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readySection: {
    marginTop: 24,
    alignItems: 'center',
  },
  readyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#3b82f6',
    gap: 12,
  },
  readyButtonActive: {
    backgroundColor: '#3b82f6',
  },
  readyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    fontFamily: 'Inter-SemiBold',
  },
  readyButtonTextActive: {
    color: 'white',
  },
  startSection: {
    marginTop: 24,
  },
  startButton: {
    width: '100%',
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  startingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startingContent: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
  },
  startingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    fontFamily: 'Inter-Bold',
  },
  startingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    fontFamily: 'Inter-Regular',
  },
});

export default MultiplayerQuizScreen;



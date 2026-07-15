import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const ChatListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/chat/conversations`);
      setConversations(response.data);
    } catch (error) {
      console.log('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/chat/users/search?q=${searchQuery}`);
      setSearchResults(response.data);
    } catch (error) {
      console.log('Error searching users:', error);
    }
  };

  const getOtherUser = (conv) => {
    return conv.user1Id === user.id ? conv.user2 : conv.user1;
  };

  const renderConversation = ({ item }) => {
    const otherUser = getOtherUser(item);
    const lastMessage = item.messages?.[0];

    return (
      <TouchableOpacity 
        style={styles.chatItem}
        onPress={() => navigation.navigate('ChatRoom', { otherUser })}
      >
        <View style={styles.avatarContainer}>
          {otherUser.profilePicture ? (
            <Image source={{ uri: otherUser.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {otherUser.doctorName ? otherUser.doctorName.substring(0, 2).toUpperCase() : ''}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.doctorName}>Dr. {otherUser.doctorName}</Text>
            {lastMessage && (
              <Text style={styles.timeText}>
                {new Date(lastMessage.createdAt).toLocaleDateString()}
              </Text>
            )}
          </View>
          <Text style={styles.specialty}>{otherUser.specialty}</Text>
          {lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage.senderId === user.id ? 'You: ' : ''}{lastMessage.content}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity 
      style={styles.searchItem}
      onPress={() => {
        setSearchQuery('');
        navigation.navigate('ChatRoom', { otherUser: item });
      }}
    >
      <View style={styles.avatarContainer}>
        {item.profilePicture ? (
          <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>
              {item.doctorName ? item.doctorName.substring(0, 2).toUpperCase() : ''}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.doctorName}>Dr. {item.doctorName}</Text>
        <Text style={styles.specialty}>{item.specialty}</Text>
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
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={{ width: 28 }} />
        </View>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors to chat..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {searchQuery.length > 0 ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSearchResult}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No doctors found.</Text>
          }
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderConversation}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No Conversations Yet</Text>
              <Text style={styles.emptyText}>Search for a doctor above to start chatting.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#1f2937',
  },
  listContainer: {
    padding: 16,
  },
  chatItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#4f46e5',
    fontWeight: 'bold',
    fontSize: 18,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  specialty: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  lastMessage: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default ChatListScreen;

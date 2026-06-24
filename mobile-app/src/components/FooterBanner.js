import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

const FooterBanner = () => {
  const { user } = useAuth();
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    if (user?.specialty) {
      fetchBanner();
    }
  }, [user]);

  const fetchBanner = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/banners?specialty=${encodeURIComponent(user.specialty)}`);
      if (response.data && response.data.length > 0) {
        // Just take the most recent applicable banner
        setBanner(response.data[0]);
      }
    } catch (error) {
      console.log('Error fetching banner:', error);
    }
  };

  if (!banner || !banner.imageUrl) return null;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: banner.imageUrl }}
        style={styles.bannerImage}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 100,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  }
});

export default FooterBanner;

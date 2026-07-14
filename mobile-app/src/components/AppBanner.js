import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, ScrollView } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

const AppBanner = ({ location }) => {
  const { user } = useAuth();
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    if (user?.specialty) {
      fetchBanners();
    }
  }, [user, location]);

  const fetchBanners = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/banners?specialty=${encodeURIComponent(user.specialty)}&location=${location}`);
      if (response.data && response.data.length > 0) {
        setBanners(response.data);
      }
    } catch (error) {
      console.log('Error fetching banners:', error);
    }
  };

  if (!banners || banners.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {banners.map((banner) => (
          <Image
            key={banner.id}
            source={{ uri: banner.imageUrl }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 120,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bannerImage: {
    width: width - 40,
    height: 120,
    marginHorizontal: 20,
    borderRadius: 16,
  }
});

export default AppBanner;

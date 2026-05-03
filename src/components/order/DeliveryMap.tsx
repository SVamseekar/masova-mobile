/**
 * Delivery Map Component
 * Shows restaurant location, customer location, and driver location (if available)
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { DeliveryAddress } from '../../types';
import { colors } from '../../styles';

interface DeliveryMapProps {
  customerAddress: DeliveryAddress;
  driverLocation?: { latitude: number; longitude: number };
  restaurantLocation?: { latitude: number; longitude: number };
  style?: object;
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({
  customerAddress,
  driverLocation,
  restaurantLocation = { latitude: 17.385, longitude: 78.4867 }, // Default: Hyderabad
  style,
}) => {
  const customerCoords = customerAddress.coordinates || {
    latitude: 17.385,
    longitude: 78.4867,
  };

  // Calculate region to show all markers
  const getRegion = () => {
    const locations = [customerCoords, restaurantLocation];
    if (driverLocation) {
      locations.push(driverLocation);
    }

    const latitudes = locations.map((loc) => loc.latitude);
    const longitudes = locations.map((loc) => loc.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const latDelta = (maxLat - minLat) * 1.5 || 0.02;
    const lngDelta = (maxLng - minLng) * 1.5 || 0.02;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={getRegion()}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        mapType="standard"
      >
        {/* Restaurant Marker */}
        <Marker
          coordinate={restaurantLocation}
          title="MaSoVa Restaurant"
          description="Your order is being prepared here"
          pinColor={'#FFD000'}
        />

        {/* Customer Marker */}
        <Marker
          coordinate={customerCoords}
          title="Delivery Address"
          description={customerAddress.street}
          pinColor={colors.semantic.success}
        />

        {/* Driver Marker (if available) */}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Driver Location"
            description="Your delivery partner is on the way"
            pinColor={'#3B82F6'}
          >
            <View style={styles.driverMarker}>
              <Text style={styles.driverMarkerText}>🚗</Text>
            </View>
          </Marker>
        )}

        {/* Route line from restaurant to customer */}
        {driverLocation && (
          <Polyline
            coordinates={[restaurantLocation, driverLocation, customerCoords]}
            strokeColor={'#FFD000'}
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  driverMarkerText: {
    fontSize: 20,
  },
});

export default DeliveryMap;

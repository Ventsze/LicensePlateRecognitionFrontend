// src/pages/History.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getParkingHistory } from '../lib/api';

export default function History() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    setError('');
    const plate = await AsyncStorage.getItem('myPlate');
    if (!plate) {
      setError('未绑定车牌');
      setLoading(false);
      return;
    }

    try {
      const history = await getParkingHistory(plate);
      setData(history);
    } catch (err) {
      setError('加载失败，请检查网络');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // 渲染每一条停车记录
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.plateText}>{item.plate}</Text>
        <Text style={[styles.statusTag, 
          { backgroundColor: item.status === 'CLOSED' ? '#E8F5E9' : '#FFF3E0', 
            color: item.status === 'CLOSED' ? '#2E7D32' : '#EF6C00' }]}>
          {item.status === 'CLOSED' ? '已完成' : '进行中'}
        </Text>
      </View>
      
      <View style={styles.detailRow}>
        <Text style={styles.label}>入场：</Text>
        <Text style={styles.value}>{new Date(item.entryTime).toLocaleString()}</Text>
      </View>
      
      {item.exitTime && (
        <View style={styles.detailRow}>
          <Text style={styles.label}>出场：</Text>
          <Text style={styles.value}>{new Date(item.exitTime).toLocaleString()}</Text>
        </View>
      )}

      <View style={styles.feeRow}>
        <Text style={styles.feeLabel}>费用：</Text>
        <Text style={styles.feeValue}>{item.fee || 0} ₽</Text>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" style={{marginTop: 50}} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>停车历史</Text>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadHistory(); }} />
        }
        ListEmptyComponent={<Text style={styles.emptyText}>暂无历史记录</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', paddingHorizontal: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginTop: 44, marginBottom: 20, color: '#1C1C1E' },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  plateText: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  statusTag: { fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', marginBottom: 6 },
  label: { fontSize: 14, color: '#8E8E93', width: 50 },
  value: { fontSize: 14, color: '#3A3A3C' },
  feeRow: { marginTop: 10, borderTopWidth: 0.5, borderTopColor: '#E5E5EA', paddingTop: 10, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'baseline' },
  feeLabel: { fontSize: 14, color: '#8E8E93' },
  feeValue: { fontSize: 20, fontWeight: 'bold', color: '#FF3B30' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#8E8E93' },
  errorText: { color: '#FF3B30', textAlign: 'center', marginBottom: 10 }
});
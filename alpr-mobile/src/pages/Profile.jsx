import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigate } from 'react-router-native';
import { getLatestSession, getWalletInfo, rechargeWallet, buyVip } from '../lib/api';

export default function Profile() {
  const [plate, setPlate] = useState(null);
  const [parkingData, setParkingData] = useState(null);
  const [walletData, setWalletData] = useState({ balance: 0, vipExpireTime: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    loadMyPlate();
  }, []);

  const loadMyPlate = async () => {
    const savedPlate = await AsyncStorage.getItem('myPlate');
    if (savedPlate) {
      setPlate(savedPlate);
      fetchParkingStatus(savedPlate);
      fetchWalletStatus(savedPlate);
    }
  };

  const handleUnbind = () => {
    Alert.alert(
      "更换车牌",
      "确定要解除当前车牌绑定并重新输入吗？",
      [
        { text: "取消", style: "cancel" },
        { 
          text: "确定解除", 
          onPress: async () => {
            await AsyncStorage.removeItem('myPlate'); 
            navigate('/login', { replace: true });    
          },
          style: 'destructive'
        }
      ]
    );
  };

  const fetchParkingStatus = async (currentPlate) => {
    setLoading(true);
    setError('');
    setParkingData(null);
    try {
      const data = await getLatestSession(currentPlate); 
      setParkingData(data);
    } catch (err) {
      if (err.message && err.message.includes('404')) {
        setError('未发现该车辆在场记录。');
      } else {
        setError('显示错误：' + err.message); 
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletStatus = async (currentPlate) => {
    try {
      const data = await getWalletInfo(currentPlate);
      setWalletData(data);
    } catch (err) {
      console.log("钱包获取失败", err);
    }
  };

  const handleRecharge = async () => {
    try {
      await rechargeWallet(plate, 1000);
      Alert.alert("成功", "已成功充值 1000 ₽");
      fetchWalletStatus(plate); 
    } catch (err) {
      Alert.alert("充值失败", err.message);
    }
  };

  const handleBuyVip = async () => {
    Alert.alert(
      "开通包月 VIP",
      "需扣除钱包余额 5000 ₽，尊享 30 天无限次免费停车，是否继续？",
      [
        { text: "取消", style: "cancel" },
        { 
          text: "确认支付", 
          onPress: async () => {
            try {
              await buyVip(plate, 30); 
              Alert.alert("开通成功", "您已成为尊贵的 VIP 车主！");
              fetchWalletStatus(plate); 
            } catch (err) {
              Alert.alert("开通失败", err.message); 
            }
          }
        }
      ]
    );
  };

  const renderWalletCard = () => {
    const isVip = walletData.vipExpireTime && new Date(walletData.vipExpireTime) > new Date();
    
    return (
      <View style={styles.statusCard}>
        <View style={styles.walletHeader}>
          <Text style={styles.cardTitle}>💰 我的钱包</Text>
          {isVip ? (
            <View style={styles.vipBadge}>
              <Text style={styles.vipBadgeText}>👑 VIP 尊享</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.newBalanceText}>{Number(walletData.balance || 0).toFixed(2)} ₽</Text>
        
        {isVip ? (
          <Text style={styles.newVipInfoText}>
            VIP 到期时间: {new Date(walletData.vipExpireTime).toLocaleDateString()}
          </Text>
        ) : (
          <Text style={styles.newVipInfoText}>开通 VIP，全场停车费全免</Text>
        )}

        <View style={styles.newActionRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleRecharge}>
            <Text style={styles.secondaryBtnText}>立即充值</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.primaryBtn, isVip && styles.vipActiveBtn]} 
            onPress={handleBuyVip}
          >
            <Text style={[styles.primaryBtnText, isVip && styles.vipActiveBtnText]}>
              {isVip ? '续费 VIP' : '开通 VIP'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderParkingStatus = () => {
    if (loading) return <ActivityIndicator size="large" color="#007aff" style={{ marginTop: 20 }} />;
    if (error) return <Text style={styles.errorText}>{error}</Text>;
    if (!parkingData) return null;

    if (parkingData.status === 'CLOSED') {
      return (
        <View style={styles.statusCard}>
          <Text style={{ fontSize: 16, color: '#34c759', fontWeight: 'bold' }}>✅ 您的爱车当前不在车库中</Text>
        </View>
      );
    }

    return (
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>🚗 当前停车状态</Text>
        <Text style={styles.infoText}>入场时间: {new Date(parkingData.entryTime).toLocaleString()}</Text>
        <Text style={styles.infoText}>状态: {parkingData.status}</Text>
        
        <View style={styles.feeContainer}>
          <Text style={{ fontSize: 16, color: '#86868b' }}>当前产生费用</Text>
          <Text style={styles.feeRedText}>
             {parkingData.fee || 0} ₽
          </Text>
        </View>

        <TouchableOpacity style={styles.payBtn} onPress={() => alert('此功能移步控制台支付...')}>
          <Text style={styles.payBtnText}>前往控制台离场</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.headerTitle}>个人中心</Text>
      
      <View style={styles.plateHeader}>
        <Text style={styles.grayLabel}>当前绑定车牌</Text>
        <Text style={styles.plateText}>{plate || '未绑定'}</Text>
        <TouchableOpacity style={styles.unbindBtn} onPress={handleUnbind}>
          <Text style={styles.unbindBtnText}>更换车牌 / 重新绑定</Text>
        </TouchableOpacity>
      </View>

      {plate && renderWalletCard()}

      {plate ? renderParkingStatus() : <Text style={styles.centerText}>请先去首页绑定车牌</Text>}

      <TouchableOpacity 
        style={styles.refreshBtn} 
        onPress={() => {
          fetchParkingStatus(plate);
          fetchWalletStatus(plate);
        }}
        disabled={!plate || loading}
      >
        <Text style={styles.refreshBtnText}>🔄 刷新状态</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7', padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1d1d1f', marginBottom: 20, marginTop: 40 },
  plateHeader: { backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  plateText: { fontSize: 24, fontWeight: 'bold', color: '#007aff', marginTop: 8, letterSpacing: 2 },
  grayLabel: { color: '#86868b' },
  centerText: { textAlign: 'center', marginTop: 20 },
  unbindBtn: { marginTop: 15, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#ff3b30' },
  unbindBtnText: { color: '#ff3b30', fontSize: 14, fontWeight: 'bold' },
  statusCard: { backgroundColor: '#fff', padding: 24, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1d1d1f' },
  infoText: { fontSize: 15, color: '#1d1d1f', marginBottom: 10 },
  feeContainer: { alignItems: 'center', marginVertical: 20, paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e5e5ea' },
  feeRedText: { fontSize: 36, fontWeight: 'bold', color: '#ff3b30' },
  payBtn: { backgroundColor: '#34c759', padding: 16, borderRadius: 12, alignItems: 'center' },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  errorText: { color: '#ff3b30', marginTop: 20, textAlign: 'center' },
  refreshBtn: { marginTop: 10, padding: 16, alignItems: 'center', backgroundColor: '#e5e5ea', borderRadius: 12 },
  refreshBtnText: { color: '#1d1d1f', fontSize: 16, fontWeight: 'bold' },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  vipBadge: { backgroundColor: '#FFFBEB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#FDE68A' },
  vipBadgeText: { color: '#B45309', fontSize: 12, fontWeight: 'bold' },
  newBalanceText: { fontSize: 42, fontWeight: '800', color: '#007aff', marginTop: 8, marginBottom: 4 },
  newVipInfoText: { color: '#86868b', fontSize: 14, marginBottom: 24 },
  newActionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  secondaryBtn: { flex: 1, backgroundColor: '#F2F2F7', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  secondaryBtnText: { color: '#1d1d1f', fontSize: 15, fontWeight: '600' },
  primaryBtn: { flex: 1, backgroundColor: '#34c759', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  vipActiveBtn: { backgroundColor: '#FFD700' },
  vipActiveBtnText: { color: '#8B6508' }
});
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigate } from 'react-router-native'; // 👉 新增：用于页面跳转
import { getLatestSession } from '../lib/api';

export default function Profile() {
  const [plate, setPlate] = useState(null);
  const [parkingData, setParkingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate(); // 👉 初始化跳转钩子

  useEffect(() => {
    loadMyPlate();
  }, []);

  const loadMyPlate = async () => {
    const savedPlate = await AsyncStorage.getItem('myPlate');
    if (savedPlate) {
      setPlate(savedPlate);
      fetchParkingStatus(savedPlate);
    }
  };

  // 👉 核心逻辑：解除当前绑定并返回登录页
  const handleUnbind = () => {
    Alert.alert(
      "更换车牌",
      "确定要解除当前车牌绑定并重新输入吗？",
      [
        { text: "取消", style: "cancel" },
        { 
          text: "确定解除", 
          onPress: async () => {
            await AsyncStorage.removeItem('myPlate'); // 1. 清空本地存储
            navigate('/login', { replace: true });    // 2. 跳转回登录页面
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
    // ✅ 使用正确的函数名调用
    const data = await getLatestSession(currentPlate); 
    setParkingData(data);
  } catch (err) {
    console.error("Profile 详细报错信息:", err); // 👈 这一行非常重要，能看到到底是什么错
    
    // 这里的判断逻辑也要稍微加强，防止把代码错误误认为网络错误
    if (err.message && err.message.includes('404')) {
      setError('未发现该车辆在场记录。');
    } else {
      setError('显示错误：' + err.message); // 👈 暂时改成显示具体错误，方便你调试
    }
  } finally {
    setLoading(false);
  }
};

  const renderParkingStatus = () => {
    if (loading) return <ActivityIndicator size="large" color="#007aff" style={{ marginTop: 20 }} />;
    if (error) return <Text style={styles.errorText}>{error}</Text>;
    if (!parkingData) return null;

    // 根据后端返回的状态字段判断
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
          <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#ff3b30' }}>
             {parkingData.fee || 0} ₽
          </Text>
        </View>

        <TouchableOpacity style={styles.payBtn} onPress={() => alert('模拟调起支付...')}>
          <Text style={styles.payBtnText}>模拟支付离场</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>个人中心</Text>
      
      <View style={styles.plateHeader}>
        <Text style={{ color: '#86868b' }}>当前绑定车牌</Text>
        <Text style={styles.plateText}>{plate || '未绑定'}</Text>
        
        {/* 👉 新增：重新绑定按钮 */}
        <TouchableOpacity style={styles.unbindBtn} onPress={handleUnbind}>
          <Text style={styles.unbindBtnText}>更换车牌 / 重新绑定</Text>
        </TouchableOpacity>
      </View>

      {plate ? renderParkingStatus() : <Text style={{textAlign: 'center', marginTop: 20}}>请先去首页绑定车牌</Text>}

      <TouchableOpacity 
        style={styles.refreshBtn} 
        onPress={() => fetchParkingStatus(plate)}
        disabled={!plate || loading}
      >
        <Text style={styles.refreshBtnText}>🔄 刷新状态</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7', padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1d1d1f', marginBottom: 20, marginTop: 40 },
  plateHeader: { backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  plateText: { fontSize: 24, fontWeight: 'bold', color: '#007aff', marginTop: 8, letterSpacing: 2 },
  unbindBtn: { marginTop: 15, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#ff3b30' },
  unbindBtnText: { color: '#ff3b30', fontSize: 14, fontWeight: 'bold' },
  statusCard: { backgroundColor: '#fff', padding: 24, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1d1d1f' },
  infoText: { fontSize: 15, color: '#1d1d1f', marginBottom: 10 },
  feeContainer: { alignItems: 'center', marginVertical: 20, paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e5e5ea' },
  payBtn: { backgroundColor: '#34c759', padding: 16, borderRadius: 12, alignItems: 'center' },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  errorText: { color: '#ff3b30', marginTop: 20, textAlign: 'center' },
  refreshBtn: { marginTop: 30, padding: 16, alignItems: 'center', backgroundColor: '#e5e5ea', borderRadius: 12 },
  refreshBtnText: { color: '#1d1d1f', fontSize: 16, fontWeight: 'bold' }
});
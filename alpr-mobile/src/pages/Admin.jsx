import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, RefreshControl, ScrollView, SafeAreaView, 
  TouchableOpacity, ActivityIndicator, TextInput, Image, Alert, Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication'; // 👉 引入生物识别库
import { getLatestSession, checkoutParking } from '../lib/api'; // 👉 引入结算 API

export default function Admin() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [plate, setPlate] = useState('');
  const [durationData, setDurationData] = useState({ hours: 0, minutes: 0, isJustArrived: false });

  const [parkLocation, setParkLocation] = useState('');
  const [parkImage, setParkImage] = useState(null);

  // 👉 新增：支付状态管理 (idle | processing | success)
  const [paymentStatus, setPaymentStatus] = useState('idle');

  const calculateDurationData = (entryTime) => {
    if (!entryTime) return null;
    const start = new Date(entryTime);
    const now = new Date();
    const diffMs = now - start;
    if (diffMs < 0) return { hours: 0, minutes: 0, isJustArrived: true };
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours: diffHrs, minutes: diffMins, isJustArrived: false };
  };

  const loadData = async () => {
    const savedPlate = await AsyncStorage.getItem('myPlate');
    setPlate(savedPlate || '');
    if (savedPlate) {
      try {
        const data = await getLatestSession(savedPlate);
        if (data && data.status !== 'CLOSED') {
          setSession(data);
          setDurationData(calculateDurationData(data.entryTime));
          
          const savedLocation = await AsyncStorage.getItem(`location_${savedPlate}`);
          const savedImage = await AsyncStorage.getItem(`image_${savedPlate}`);
          if (savedLocation) setParkLocation(savedLocation);
          if (savedImage) setParkImage(savedImage);
        } else {
          setSession(null);
          await AsyncStorage.removeItem(`location_${savedPlate}`);
          await AsyncStorage.removeItem(`image_${savedPlate}`);
          setParkLocation('');
          setParkImage(null);
        }
      } catch (err) {
        setSession(null);
      }
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      if (session && session.entryTime) {
        setDurationData(calculateDurationData(session.entryTime));
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [session?.entryTime]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSaveLocation = async (text) => {
    setParkLocation(text);
    if (plate) await AsyncStorage.setItem(`location_${plate}`, text);
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('权限不足', '需要相机权限才能拍摄车位照片哦！');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.5 });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setParkImage(uri);
      if (plate) await AsyncStorage.setItem(`image_${plate}`, uri);
    }
  };

  const handleClearPhoto = async () => {
    setParkImage(null);
    if (plate) await AsyncStorage.removeItem(`image_${plate}`);
  };

  // 👉 核心逻辑：呼出 Face ID 并执行支付闭环
  const handlePayment = async () => {
    try {
      // 1. 检查设备是否支持生物识别
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert('提示', '您的设备不支持或未设置 Face ID / 指纹识别，将直接模拟支付。');
        // 如果没有 FaceID，直接跳去扣款
      } else {
        // 2. 调起原生 iOS/Android 的生物验证面板
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: `支付停车费 ${session.fee || 0} ₽`, // 面板上的提示语
          cancelLabel: '取消',
          disableDeviceFallback: false, // 允许输入密码兜底
        });

        if (!authResult.success) {
          return; // 用户点击了取消或验证失败，直接中断
        }
      }

      // 3. 验证成功，开始向后端发送结算请求
      setPaymentStatus('processing');
      await checkoutParking(session.plate);

      // 4. 结算成功，展示绿色打勾状态
      setPaymentStatus('success');
      
      // 5. 延迟 1.5 秒后，刷新页面，车辆状态变成“当前不在场”
      setTimeout(() => {
        setPaymentStatus('idle');
        loadData();
      }, 1500);

    } catch (error) {
      setPaymentStatus('idle');
      Alert.alert('支付失败', '网络连接异常，请重试');
    }
  };

  const renderContent = () => {
    if (loading) return <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />;
    if (!plate) return <View style={styles.emptyCard}><Text style={styles.emptyText}>未绑定车牌</Text></View>;
    if (!session) return <View style={styles.emptyCard}><Text style={styles.emptyText}>当前不在场</Text></View>;

    return (
      <View>
        <View style={styles.statusCard}>
          <View style={styles.badgeRow}>
            <View style={styles.statusBadge}><Text style={styles.statusBadgeText}>当前停泊中</Text></View>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.plateLabel}>已绑定车牌</Text>
            <Text style={styles.plateNumber}>{session.plate}</Text>
            <View style={styles.timeInfo}>
              <Text style={styles.infoLabel}>入场时间</Text>
              <Text style={styles.entryTimeLarge}>{new Date(session.entryTime).toLocaleString()}</Text>
              {durationData && (
                <Text style={styles.durationHighlight}>
                  已停车{' '}
                  {durationData.isJustArrived ? <Text style={styles.redHighlight}>刚刚</Text> : <><Text style={styles.redHighlight}>{durationData.hours}</Text>{' 小时 '}<Text style={styles.redHighlight}>{durationData.minutes}</Text>{' 分钟'}</>}
                </Text>
              )}
            </View>
            <View style={styles.divider} />
            <View style={styles.feeContainer}>
              <Text style={styles.feeLabel}>当前预估费用</Text>
              <View style={styles.feeWrapper}>
                <Text style={styles.feeAmount}>{session.fee || 0.00}</Text>
                <Text style={styles.feeCurrency}> ₽</Text>
              </View>
            </View>
            <View style={styles.divider} />

            {/* 👉 支付按钮状态机 */}
            <TouchableOpacity 
              style={[
                styles.payBtn, 
                paymentStatus === 'success' && { backgroundColor: '#34C759' } // 成功保持绿色
              ]} 
              onPress={handlePayment}
              disabled={paymentStatus !== 'idle'}
            >
              {paymentStatus === 'idle' && <Text style={styles.payBtnText}>立即支付离场</Text>}
              {paymentStatus === 'processing' && <ActivityIndicator color="#FFFFFF" />}
              {paymentStatus === 'success' && <Text style={styles.payBtnText}>✓ 支付成功，祝您一路顺风</Text>}
            </TouchableOpacity>

          </View>
        </View>

        <View style={styles.locationCard}>
          <Text style={styles.locationCardTitle}>📍 泊位记录</Text>
          <Text style={styles.locationSubTitle}>记录车位号或拍下附近的柱子，不再迷路</Text>
          <TextInput 
            style={styles.locationInput} placeholder="例如：B2层 C区 108号" placeholderTextColor="#C7C7CC"
            value={parkLocation} onChangeText={setParkLocation} onEndEditing={(e) => handleSaveLocation(e.nativeEvent.text)}
            returnKeyType="done" autoCorrect={false} spellCheck={false}
          />
          {parkImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: parkImage }} style={styles.parkImage} />
              <TouchableOpacity style={styles.rephotoBtn} onPress={handleClearPhoto}>
                <Text style={styles.rephotoBtnText}>重新拍摄</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.cameraBtn} onPress={handleTakePhoto}>
              <Text style={styles.cameraBtnText}>📸 拍下车位柱</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
        <ScrollView 
          style={styles.container}
          contentContainerStyle={{ paddingTop: 60, paddingBottom: 120 }} 
          keyboardShouldPersistTaps="handled" 
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true} // 👉 原生键盘避让
        >
          <Text style={styles.headerTitle}>控制台</Text>
          {renderContent()}
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { flex: 1, paddingHorizontal: 20 },
  headerTitle: { fontSize: 34, fontWeight: '800', color: '#1C1C1E', marginTop: 20, marginBottom: 24 },
  statusCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3, marginBottom: 20 },
  badgeRow: { flexDirection: 'row', marginBottom: 20 },
  statusBadge: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  statusBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  cardBody: { width: '100%' },
  plateLabel: { fontSize: 13, color: '#8E8E93', fontWeight: '600', textTransform: 'uppercase' },
  plateNumber: { fontSize: 28, fontWeight: '800', color: '#1C1C1E', marginTop: 4 },
  timeInfo: { marginTop: 16 },
  infoLabel: { fontSize: 13, color: '#8E8E93', marginBottom: 4 },
  entryTimeLarge: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  durationHighlight: { fontSize: 15, color: '#8E8E93', marginTop: 6, fontWeight: '500' },
  redHighlight: { color: '#FF3B30', fontWeight: '700' },
  divider: { height: 0.5, backgroundColor: '#E5E5EA', marginVertical: 20 },
  feeContainer: { alignItems: 'center' },
  feeLabel: { fontSize: 15, color: '#8E8E93', marginBottom: 8 },
  feeWrapper: { flexDirection: 'row', alignItems: 'baseline' },
  feeAmount: { fontSize: 48, fontWeight: '800', color: '#FF3B30' },
  feeCurrency: { fontSize: 20, fontWeight: '600', color: '#FF3B30' },
  payBtn: { backgroundColor: '#1C1C1E', paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8 },
  payBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 60, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E5EA', borderStyle: 'dashed' },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#8E8E93' },
  locationCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  locationCardTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginBottom: 4 },
  locationSubTitle: { fontSize: 13, color: '#8E8E93', marginBottom: 16 },
  locationInput: { backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1C1C1E', fontWeight: '500', marginBottom: 16 },
  cameraBtn: { backgroundColor: '#F2F2F7', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cameraBtnText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  imageContainer: { alignItems: 'center' },
  parkImage: { width: '100%', height: 200, borderRadius: 16, marginBottom: 12 },
  rephotoBtn: { paddingVertical: 8 },
  rephotoBtnText: { color: '#FF3B30', fontSize: 15, fontWeight: '600' }
});
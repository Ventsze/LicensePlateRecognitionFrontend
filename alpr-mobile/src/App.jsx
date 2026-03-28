import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { NativeRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 👉 1. 核心：从外面的真实文件中引入你的业务页面！
import Profile from './pages/Profile'; 
import Admin from './pages/Admin';
import HistoryPage from './pages/History';

// ==========================================
// 登录页面 (Login)
// ==========================================
function Login() {
  const navigate = useNavigate();
  const [plate, setPlate] = useState('');

  const handleLogin = async () => {
    if (!plate) return;
    await AsyncStorage.setItem('myPlate', plate); 
    navigate('/admin', { replace: true }); 
  };

  return (
    <SafeAreaView style={styles.center}>
      <Text style={{ fontSize: 24, marginBottom: 20, fontWeight: 'bold' }}>停车系统登录</Text>
      <TextInput
        style={styles.input}
        placeholder="请输入车牌号绑定"
        value={plate}
        onChangeText={setPlate}
      />
      <TouchableOpacity style={styles.btn} onPress={handleLogin}>
        <Text style={{ color: '#fff' }}>绑 定 车 牌</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ==========================================
// 私有路由拦截 (PrivateRoute)
// ==========================================
function PrivateRoute({ children }) {
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('myPlate').then(val => {
      setIsAuth(!!val); 
    });
  }, []);

  if (isAuth === null) return <Text style={{marginTop: 50, textAlign: 'center'}}>加载中...</Text>;
  return isAuth ? children : <Navigate to="/login" replace />;
}

// ==========================================
// 全局布局组件 (Layout - 带有底部导航栏)
// ==========================================
function Layout() {
  const navigate = useNavigate();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f7' }}>
      <View style={{ flex: 1 }}>
        <Outlet />
      </View>
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigate('/admin')} style={styles.navItem}>
          <Text>📊 控制台</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigate('/history')} style={styles.navItem}>
          <Text>📁 历史</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigate('/profile')} style={styles.navItem}>
          <Text>👤 我的</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// 根组件与路由配置 (App)
// ==========================================
export default function App() {
  return (
    <NativeRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/admin" replace />} />
          <Route path="admin" element={<Admin />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </NativeRouter>
  );
}

// ==========================================
// 简单样式
// ==========================================
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  page: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
  input: { width: '80%', padding: 15, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 20 },
  btn: { backgroundColor: '#007aff', padding: 15, borderRadius: 8, width: '80%', alignItems: 'center' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ddd', paddingBottom: 20 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 15 },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // 仿毛玻璃质感
    borderTopWidth: 0.5,
    borderTopColor: '#D1D1D6', // 极细的分割线
    paddingBottom: 25, // 为底部手势区域留出空间
    paddingTop: 12,
    height: 85,
    position: 'absolute', // 让内容沉浸到底部
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 10,
    marginTop: 4,
    color: '#8E8E93', // iOS 默认未选中灰色
    fontWeight: '500',
  },
  navTextActive: {
    color: '#007AFF', // iOS 经典蓝色
  }
});
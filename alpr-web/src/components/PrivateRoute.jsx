import React from 'react';
import { Navigate } from 'react-router-dom';

// 这是一个“保安”组件，它会包裹住你那些需要保护的页面
export default function PrivateRoute({ children }) {
  // 检查浏览器本地有没有我们刚才打上的 'isAuth' 标记
  const isAuth = localStorage.getItem('isAuth');
  
  // 如果有标记，就放行（正常显示里面的页面）
  // 如果没标记，就强制让页面跳转回 /login
  return isAuth ? children : <Navigate to="/login" replace />;
}
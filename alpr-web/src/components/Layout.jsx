import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './Layout.css'; 

export default function Layout() {
  const navigate = useNavigate();
  // 增加一个状态，用来控制手机端侧边栏是否展开
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('isAuth');
    navigate('/login');
  };

  // 切换菜单状态
  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  // 点击菜单项后自动关闭（手机端体验更好）
  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="app-container">
      {/* 📱 移动端专属顶部导航栏（PC端会隐藏） */}
      <header className="mobile-header">
        <h2 className="mobile-logo">🅿️ 停车管理</h2>
        <button className="menu-toggle-btn" onClick={toggleMenu}>
          {isMobileMenuOpen ? '✖' : '☰'}
        </button>
      </header>

      {/* 📱 移动端半透明遮罩层（点击遮罩区域关闭菜单） */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMenu}></div>
      )}

      {/* 💻 左侧导航栏（手机端会变成滑出的抽屉） */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h2>🅿️ 停车管理系统</h2>
        </div>
        
        <nav className="nav-menu">
          <NavLink to="/dashboard" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            📊 数据大屏
          </NavLink>
          <NavLink to="/admin" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            📊 总览与在场车辆
          </NavLink>
          <NavLink to="/history" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            📁 历史记录
          </NavLink>
          <NavLink to="/autoinout" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            🚗 模拟进出库
          </NavLink>
          <NavLink to="/capture" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            📷 实时监控抓拍
          </NavLink>
          <NavLink to="/upload" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            📤 手动上传识别
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>🚪 退出登录</button>
        </div>
      </aside>

      {/* 🖥️ 右侧主内容区 */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
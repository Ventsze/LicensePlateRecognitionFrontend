// src/pages/Login.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Style/Login.css"; 

/* =========================================
   高级线性 SVG 图标 (调小尺寸并微调位置)
   ========================================= */
const EyeOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

/* =========================================
   交互小怪物核心动画组件
   ========================================= */
const Pupil = ({ size = 12, maxDistance = 5, pupilColor = "black", forceLookX, forceLookY }) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const pupilRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const calculatePupilPosition = () => {
    if (!pupilRef.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };

    const pupil = pupilRef.current.getBoundingClientRect();
    const pupilCenterX = pupil.left + pupil.width / 2;
    const pupilCenterY = pupil.top + pupil.height / 2;

    const deltaX = mouseX - pupilCenterX;
    const deltaY = mouseY - pupilCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={pupilRef}
      style={{
        width: `${size}px`, height: `${size}px`,
        backgroundColor: pupilColor, borderRadius: "50%",
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  );
};

const EyeBall = ({ size = 48, pupilSize = 16, maxDistance = 10, eyeColor = "white", pupilColor = "black", isBlinking = false, forceLookX, forceLookY }) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const eyeRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const calculatePupilPosition = () => {
    if (!eyeRef.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };

    const eye = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = eye.left + eye.width / 2;
    const eyeCenterY = eye.top + eye.height / 2;

    const deltaX = mouseX - eyeCenterX;
    const deltaY = mouseY - eyeCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={eyeRef}
      style={{
        width: `${size}px`, height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor, borderRadius: "50%", overflow: 'hidden',
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s"
      }}
    >
      {!isBlinking && (
        <div
          style={{
            width: `${pupilSize}px`, height: `${pupilSize}px`,
            backgroundColor: pupilColor, borderRadius: "50%",
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  );
};

function AnimatedCharacters({ isTyping = false, showPassword = false, passwordLength = 0 }) {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  
  const purpleRef = useRef(null);
  const blackRef = useRef(null);
  const yellowRef = useRef(null);
  const orangeRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;
    const scheduleBlink = () => {
      return setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => { setIsPurpleBlinking(false); scheduleBlink(); }, 150);
      }, getRandomBlinkInterval());
    };
    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;
    const scheduleBlink = () => {
      return setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => { setIsBlackBlinking(false); scheduleBlink(); }, 150);
      }, getRandomBlinkInterval());
    };
    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => setIsLookingAtEachOther(false), 800);
      return () => clearTimeout(timer);
    } else {
      setIsLookingAtEachOther(false);
    }
  }, [isTyping]);

  useEffect(() => {
    if (passwordLength > 0 && showPassword) {
      const schedulePeek = () => {
        return setTimeout(() => {
          setIsPurplePeeking(true);
          setTimeout(() => setIsPurplePeeking(false), 800);
        }, Math.random() * 3000 + 2000);
      };
      const firstPeek = schedulePeek();
      return () => clearTimeout(firstPeek);
    } else {
      setIsPurplePeeking(false);
    }
  }, [passwordLength, showPassword]);

  const calculatePosition = (ref) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;

    return {
      faceX: Math.max(-15, Math.min(15, deltaX / 20)),
      faceY: Math.max(-10, Math.min(10, deltaY / 30)),
      bodySkew: Math.max(-6, Math.min(6, -deltaX / 120))
    };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  const isHidingPassword = passwordLength > 0 && !showPassword;

  return (
    <div style={{ position: "relative", width: '550px', height: '400px', transform: 'scale(0.85)' }}>
      {/* Purple tall rectangle */}
      <div 
        ref={purpleRef}
        style={{
          position: "absolute", bottom: 0, left: '70px', width: '180px',
          height: (isTyping || isHidingPassword) ? '440px' : '400px',
          backgroundColor: '#6C3FF5', borderRadius: '10px 10px 0 0', zIndex: 1,
          transform: (passwordLength > 0 && showPassword)
            ? `skewX(0deg)`
            : (isTyping || isHidingPassword)
              ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)` 
              : `skewX(${purplePos.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center', transition: "all 0.7s ease-in-out"
        }}
      >
        <div style={{
            position: "absolute", display: "flex", gap: "32px", transition: "all 0.7s ease-in-out",
            left: (passwordLength > 0 && showPassword) ? `${20}px` : isLookingAtEachOther ? `${55}px` : `${45 + purplePos.faceX}px`,
            top: (passwordLength > 0 && showPassword) ? `${35}px` : isLookingAtEachOther ? `${65}px` : `${40 + purplePos.faceY}px`,
          }}
        >
          <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isPurpleBlinking} forceLookX={(passwordLength > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} forceLookY={(passwordLength > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
          <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isPurpleBlinking} forceLookX={(passwordLength > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} forceLookY={(passwordLength > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
        </div>
      </div>

      {/* Black tall rectangle */}
      <div 
        ref={blackRef}
        style={{
          position: "absolute", bottom: 0, left: '240px', width: '120px', height: '310px',
          backgroundColor: '#2D2D2D', borderRadius: '8px 8px 0 0', zIndex: 2,
          transform: (passwordLength > 0 && showPassword)
            ? `skewX(0deg)`
            : isLookingAtEachOther
              ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
              : (isTyping || isHidingPassword)
                ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)` 
                : `skewX(${blackPos.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center', transition: "all 0.7s ease-in-out"
        }}
      >
        <div style={{
            position: "absolute", display: "flex", gap: "24px", transition: "all 0.7s ease-in-out",
            left: (passwordLength > 0 && showPassword) ? `${10}px` : isLookingAtEachOther ? `${32}px` : `${26 + blackPos.faceX}px`,
            top: (passwordLength > 0 && showPassword) ? `${28}px` : isLookingAtEachOther ? `${12}px` : `${32 + blackPos.faceY}px`,
          }}
        >
          <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking} forceLookX={(passwordLength > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={(passwordLength > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined} />
          <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking} forceLookX={(passwordLength > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={(passwordLength > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined} />
        </div>
      </div>

      {/* Orange semi-circle */}
      <div 
        ref={orangeRef}
        style={{
          position: "absolute", bottom: 0, left: '0px', width: '240px', height: '200px',
          zIndex: 3, backgroundColor: '#FF9B6B', borderRadius: '120px 120px 0 0',
          transform: (passwordLength > 0 && showPassword) ? `skewX(0deg)` : `skewX(${orangePos.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center', transition: "all 0.7s ease-in-out"
        }}
      >
        <div style={{
            position: "absolute", display: "flex", gap: "32px", transition: "all 0.2s ease-out",
            left: (passwordLength > 0 && showPassword) ? `${50}px` : `${82 + (orangePos.faceX || 0)}px`,
            top: (passwordLength > 0 && showPassword) ? `${85}px` : `${90 + (orangePos.faceY || 0)}px`,
          }}
        >
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(passwordLength > 0 && showPassword) ? -5 : undefined} forceLookY={(passwordLength > 0 && showPassword) ? -4 : undefined} />
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(passwordLength > 0 && showPassword) ? -5 : undefined} forceLookY={(passwordLength > 0 && showPassword) ? -4 : undefined} />
        </div>
      </div>

      {/* Yellow tall rectangle */}
      <div 
        ref={yellowRef}
        style={{
          position: "absolute", bottom: 0, left: '310px', width: '140px', height: '230px',
          backgroundColor: '#E8D754', borderRadius: '70px 70px 0 0', zIndex: 4,
          transform: (passwordLength > 0 && showPassword) ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center', transition: "all 0.7s ease-in-out"
        }}
      >
        <div style={{
            position: "absolute", display: "flex", gap: "24px", transition: "all 0.2s ease-out",
            left: (passwordLength > 0 && showPassword) ? `${20}px` : `${52 + (yellowPos.faceX || 0)}px`,
            top: (passwordLength > 0 && showPassword) ? `${35}px` : `${40 + (yellowPos.faceY || 0)}px`,
          }}
        >
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(passwordLength > 0 && showPassword) ? -5 : undefined} forceLookY={(passwordLength > 0 && showPassword) ? -4 : undefined} />
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(passwordLength > 0 && showPassword) ? -5 : undefined} forceLookY={(passwordLength > 0 && showPassword) ? -4 : undefined} />
        </div>
        <div style={{
            position: "absolute", width: "80px", height: "4px", backgroundColor: "#2D2D2D", borderRadius: "9999px", transition: "all 0.2s ease-out",
            left: (passwordLength > 0 && showPassword) ? `${10}px` : `${40 + (yellowPos.faceX || 0)}px`,
            top: (passwordLength > 0 && showPassword) ? `${88}px` : `${88 + (yellowPos.faceY || 0)}px`,
          }}
        />
      </div>
    </div>
  );
}

/* =========================================
   极致苹果风表单 (修复了真实后端的请求)
   ========================================= */

export default function Login() {
  const navigate = useNavigate();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // 动画状态
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // 👉 这里就是你刚才发给我的“救命代码”
  const handleLogin = async (e) => {
    e.preventDefault(); 
    setErrorMsg('');
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      // ✅ 关键点 1：使用代理路由 /api/login，解决跨域问题
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        credentials: 'include', 
      });

      if (response.ok) {
        // ✅ 关键点 2：必须把 isAuth 设置为 true，否则会被路由守卫踢回来！
        localStorage.setItem('isAuth', 'true');
        navigate('/');
      } else {
        setErrorMsg('账号或密码错误，请重试！');
      }
    } catch (error) {
      console.error('登录请求失败:', error);
      setErrorMsg('网络请求失败，请检查后端是否启动。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-container">
      {/* 左侧：移植过来的原汁原味小怪物 */}
      <div className="login-left-panel">
        <div className="login-logo">
          🅿️ 智能停车管理系统
        </div>

        <div className="login-animation-box" style={{ overflow: "hidden" }}>
          <AnimatedCharacters 
            isTyping={isTyping} 
            showPassword={showPassword} 
            passwordLength={password.length} 
          />
        </div>

        <div style={{ zIndex: 10, fontSize: 13, opacity: 0.8 }}>
          By Wenze
        </div>
      </div>

      {/* 右侧：纯粹的苹果风表单 */}
      <div className="login-right-panel">
        <div className="login-form-box">
          
          {/* iOS 风格的极简标题 */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: "#1d1d1f", margin: "0 0 8px" }}>系统登录</h1>
            <p style={{ margin: 0, fontSize: 14, color: "#86868b" }}>使用您的管理员账号继续</p>
          </div>

          <form onSubmit={handleLogin}>
            
            {/* iOS 原生无边框输入框 */}
            <div className="input-group">
              <input
                type="text"
                className="mac-input"
                placeholder="账号或手机号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                required
              />
            </div>

            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                className="mac-input"
                style={{ paddingRight: 40 }} /* 给眼睛图标留出空间 */
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsTyping(true)} 
                onBlur={() => setIsTyping(false)}
                required
              />
              
              <button
                type="button"
                className="pwd-toggle-btn"
                style={{ transform: "translateY(calc(-50% - 0px))" }} 
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
              </button>
            </div>

            {errorMsg && (
              <div style={{ padding: "10px", background: "#fff0f0", color: "#ff3b30", borderRadius: 8, fontSize: 13, marginBottom: 16, textAlign: "center" }}>
                {errorMsg}
              </div>
            )}

            {/* iOS 原生深空灰按钮 */}
            <button 
              type="submit" 
              className="mac-btn" 
              disabled={loading}
            >
              {loading ? "正在登录..." : "登 录"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
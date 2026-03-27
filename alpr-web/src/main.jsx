import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom"; // 👉 新增了 Navigate

import "./index.css";
import Upload from "./pages/Upload.jsx";
import Result from "./pages/Result.jsx";
import HistoryPage from "./pages/History.jsx"; 
import Capture from "./pages/Capture.jsx"; 
import AutoInOut from "./pages/AutoInOut";
import Admin from "./pages/Admin";
import Login from "./pages/Login.jsx"; 
import PrivateRoute from "./components/PrivateRoute.jsx"; 
import Layout from "./components/Layout.jsx"; 
import Dashboard from "./pages/Dashboard.jsx";

const router = createBrowserRouter([
  { path: "/login", element: <Login /> }, 
  
  // 👉 使用嵌套路由：Layout 作为包裹层，里面所有的页面都会带有左侧导航栏
  {
    path: "/",
    element: (
      <PrivateRoute>
        <Layout />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin" replace /> }, 
      
      { path: "admin", element: <Admin /> },        // 你的新默认主页
      { path: "upload", element: <Upload /> },      // 原本的上传页挪到了 /upload 路径下
      
      { path: "result", element: <Result /> },      // /result
      { path: "history", element: <HistoryPage /> },// /history
      { path: "capture", element: <Capture /> },    // /capture
      { path: "autoinout", element: <AutoInOut /> },// /autoinout
      { path: "dashboard", element: <Dashboard /> },
    ]
  }
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
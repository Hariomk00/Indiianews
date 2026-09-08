import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CategoryPage from "./pages/CategoryPage";
import NewsDetail from "./pages/NewsDetail";
import AdminLogin from "./pages/admin/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import ManageCategories from "./pages/admin/ManageCategories";
import ManageNews from "./pages/admin/ManageNews";
import AddEditNews from "./pages/admin/AddEditNews";
import ImportNews from "./pages/admin/ImportNews";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/category/:id" element={<CategoryPage />} />
        <Route path="/news/:id" element={<NewsDetail />} />

        {/* Admin Login Route */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-categories"
          element={
            <ProtectedRoute>
              <ManageCategories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-news"
          element={
            <ProtectedRoute>
              <ManageNews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/add-news"
          element={
            <ProtectedRoute>
              <AddEditNews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/edit-news/:id"
          element={
            <ProtectedRoute>
              <AddEditNews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/import-news"
          element={
            <ProtectedRoute>
              <ImportNews />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

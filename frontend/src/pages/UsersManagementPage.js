import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UsersManagementPage.css';

const UsersManagementPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('Vui lòng đăng nhập lại.');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/admin/users?page=1&limit=10", {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Không thể lấy danh sách người dùng.");
      }

      const usersData = await response.json();
      setUsers(usersData);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="users-management-page">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-management-page">
        <div className="error">Lỗi: {error}</div>
      </div>
    );
  }

  return (
    <div className="users-management-page">
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-content">
            <div className="sidebar-header">
              <div className="logo-section">
                <img src="../images/a2airbnb 2.png" alt="Logo" className="logo-image" />
                <h2 className="logo-title">A2BnB Admin</h2>
              </div>
              <nav className="navigation">
                <a href="/admin/dashboard" className="nav-item">🏠 Dashboard</a>
                <a href="/admin/users-management" className="nav-item active">👥 Quản lý khách hàng</a>
                <a href="/admin/products-management" className="nav-item">🏘️ Quản lý phòng</a>
                <a href="/admin/bookings-management" className="nav-item">📆 Quản lý đặt phòng</a>
              </nav>
            </div>
            <button onClick={logout} className="logout-btn">← Đăng xuất</button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <h1 className="page-title">Quản lý khách hàng</h1>

          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên</th>
                  <th>Email</th>
                  <th>SĐT</th>
                  <th>Xác minh</th>
                  <th>Vai trò</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id} className="table-row">
                    <td>{user.id}</td>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>{user.phoneNumber || "-"}</td>
                    <td>
                      <span className={`status ${user.isVerified ? 'verified' : 'unverified'}`}>
                        {user.isVerified ? '✓ Đã xác minh' : '✗ Chưa xác minh'}
                      </span>
                    </td>
                    <td>
                      <span className="role-badge">
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="edit-btn">Sửa</button>
                        <button className="delete-btn">Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UsersManagementPage;

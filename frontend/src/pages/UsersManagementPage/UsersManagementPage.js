import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserAPI from '../../api/userApi';
import PageHeader from '../../components/PageHeader/PageHeader';

// 👉 dùng CSS Modules
import styles from './UsersManagementPage.module.css';

const UsersManagementPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);

    try {
      // Cookie-mode: UserAPI.getUsers đã gọi fetch(..., { credentials: 'include' })
      const data = await UserAPI.getUsers(1, 10);

      const list =
        Array.isArray(data) ? data :
        data.items || data.users || [];

      setUsers(list);
    } catch (err) {
      const msg = err?.message || 'Không thể lấy danh sách người dùng.';
      setError(msg);

      // Nếu backend trả 401/không có quyền -> quay về login
      if (/401|không.*xác thực|unauthor/i.test(msg)) {
        // dọn cache UI nếu có
        sessionStorage.removeItem('userData');
        localStorage.removeItem('userData');
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa người dùng này?')) return;
    try {
      await UserAPI.deleteUser(id);                        // ← KHÔNG truyền token
      setUsers(prev => prev.filter(u => (u.id ?? u._id) !== id));
      alert('Xóa người dùng thành công!');
    } catch (err) {
      if (err.status === 401 || /xác thực|401/i.test(err.message)) {
        navigate('/login'); return;
      }
      alert(err.message || 'Xóa thất bại.');
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>Lỗi: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Quản lý khách hàng"
        crumbs={[{ label: 'Dashboard', to: '/admin/dashboard' }, { label: 'Quản lý khách hàng' }]}
      />

      <div className={styles.layout}>
        <main className={styles.main}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeader}>
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
                {users.map((user) => {
                  const id = user.id ?? user._id;
                  return (
                    <tr key={id} className={styles.row}>
                      <td>{id}</td>
                      <td>{user.fullName || user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phoneNumber || '-'}</td>
                      <td>
                        <span className={`${styles.status} ${user.isVerified ? styles.verified : styles.unverified}`}>
                          {user.isVerified ? '✓ Đã xác minh' : '✗ Chưa xác minh'}
                        </span>
                      </td>
                      <td><span className={styles.roleBadge}>{user.role}</span></td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.btnEdit}
                            onClick={() => navigate(`/admin/users-management/${id}`)}
                          >
                            Sửa
                          </button>
                          <button
                            className={styles.btnDelete}
                            onClick={() => handleDeleteUser(id)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr><td colSpan={7} className={styles.empty}>Không có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UsersManagementPage;

import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import styles from './AdminLayout.module.css';

const API_BASE_URL =
  (process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '')) || 'http://localhost:3000';

export default function AdminLayout() {
  const navigate = useNavigate();
  const onLogout = async () => {
    try {
      // gọi BE để xóa cookie bidstay_token
      await fetch(`${API_BASE_URL}/user/logout`, {
        method: 'POST',
        credentials: 'include',     // gửi kèm cookie
      });
    } catch (e) {
      // không cần chặn UI nếu request fail
      console.warn('Logout call failed:', e);
    } finally {
      // dọn cache UI
      sessionStorage.removeItem('userData');
      sessionStorage.removeItem('token');
      localStorage.removeItem('userData');
      localStorage.removeItem('token');
      navigate('/');
    }
  }

  return (
    <div className={styles.layout}>
      <Sidebar onLogout={onLogout} compact />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

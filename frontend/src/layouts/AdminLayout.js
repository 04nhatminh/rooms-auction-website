import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const navigate = useNavigate();
  const onLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className={styles.layout}>
      <Sidebar onLogout={onLogout} compact />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

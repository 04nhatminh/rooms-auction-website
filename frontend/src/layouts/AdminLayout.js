import { Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '../components/Sidebar/Sidebar';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  
  const onLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className={styles.layout}>
      <Sidebar 
        onLogout={onLogout} 
        compact={sidebarCollapsed}
        onToggle={toggleSidebar}
      />
      <main className={`${styles.main} ${sidebarCollapsed ? styles.mainExpanded : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}

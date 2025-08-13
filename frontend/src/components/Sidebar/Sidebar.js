import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';
import logo from '../../assets/logo.png';

export default function Sidebar({ onLogout, compact = true }) {
  const menu = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/admin/users-management', label: 'Quản lý khách hàng', icon: '👥' },
    { to: '/admin/products-management', label: 'Quản lý phòng', icon: '🏘️' },
    { to: '/admin/bookings-management', label: 'Quản lý đặt phòng', icon: '📆' },
  ];

  return (
    <aside className={`${styles.sidebar} ${compact ? styles.compact : ''}`}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <img src={logo} className={styles.logoImg} alt="Logo" />
            <h2 className={styles.logoText}>A2BnB Admin</h2>
          </div>
          <nav className={styles.nav}>
            {menu.map(m => (
              <NavLink
                key={m.to}
                to={m.to}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
              >
                <span className={styles.icon}>{m.icon}</span>
                <span>{m.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <button onClick={onLogout} className={styles.logout}>
          ← Đăng xuất
        </button>
      </div>
    </aside>
  );
}

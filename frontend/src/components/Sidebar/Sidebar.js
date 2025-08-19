import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';
import logo from '../../assets/logo.png';
import menuIcon from '../../assets/menu_white.png';

export default function Sidebar({ onLogout, compact = false, onToggle }) {
  const menu = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/admin/users-management', label: 'Quản lý khách hàng', icon: '👥' },
    { to: '/admin/products-management', label: 'Quản lý sản phẩm', icon: '🏘️' },
    { to: '/admin/bookings-management', label: 'Quản lý đặt phòng', icon: '📆' },
    { to: '/admin/system-config', label: 'Cấu hình hệ thống', icon: '⚙️' },
    { to: '/admin/data-scraping', label: 'Thu thập dữ liệu', icon: '🔄' },
  ];

  return (
    <aside className={`${styles.sidebar} ${compact ? styles.compact : ''}`}>
      <div className={styles.content}>
        <div className={styles.topBar}>
          <button 
            className={styles.menuButton}
            onClick={onToggle}
            title={compact ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            <img src={menuIcon} className={styles.menuIcon} alt="Menu" />
          </button>
          {!compact && (
            <h2 className={styles.menuText}>Bidstay Admin</h2>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className={styles.nav}>
          {menu.map(m => (
            <NavLink
              key={m.to}
              to={m.to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              title={compact ? m.label : ''}
            >
              <span className={styles.navIcon}>{m.icon}</span>
              {!compact && <span className={styles.navLabel}>{m.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <button onClick={onLogout} className={styles.logout} title={compact ? 'Đăng xuất' : ''}>
          <span className={styles.logoutIcon}>←</span>
          {!compact && <span className={styles.logoutLabel}>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}

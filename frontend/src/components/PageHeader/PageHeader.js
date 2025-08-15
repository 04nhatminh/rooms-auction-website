import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './PageHeader.module.css';

export default function PageHeader({ title, crumbs = [], right = null }) {
  const nav = useNavigate();

  return (
    <div className={styles.header}>
      {/* LEFT: Breadcrumbs (← Quay lại / Danh sách / Chi tiết) */}
      <div className={styles.crumbs}>
        <button className={styles.back} onClick={() => nav(-1)}>← Quay lại</button>

        {crumbs.length > 0 && <span className={styles.sep}>/</span>}
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {c.to
              ? <Link to={c.to} className={styles.link}>{c.label}</Link>
              : <span className={styles.muted}>{c.label}</span>}
            {i < crumbs.length - 1 && <span className={styles.sep}>/</span>}
          </React.Fragment>
        ))}
      </div>

      {/* RIGHT: Page title + optional actions */}
      <div className={styles.right}>
        <h1 className={styles.title}>{title}</h1>
        {right && <div className={styles.actions}>{right}</div>}
      </div>
    </div>
  );
}

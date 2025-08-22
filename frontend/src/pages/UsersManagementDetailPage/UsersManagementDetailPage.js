import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import UserAPI from '../../api/userApi';
import PageHeader from '../../components/PageHeader/PageHeader';
import styles from './UsersManagementDetailPage.module.css';

function toLocalDatetimeValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalDatetimeValue(val) {
  if (!val) return null;
  return new Date(val).toISOString();
}

export default function UsersManagementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('active');            // active | disabled | suspended
  const [suspendedUntil, setSuspendedUntil] = useState('');  // datetime-local value
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await UserAPI.getUserById(id);          // ← KHÔNG truyền token
      setUser(data);
      setStatus(data.status || 'active');
      setSuspendedUntil(toLocalDatetimeValue(data?.suspendedUntil));
    } catch (e) {
      if (e.status === 401 || /xác thực|401/i.test(e.message)) {
        navigate('/login'); return;
      }
      setError(e.message || 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const onSaveStatus = async () => {
    setMsg('');
    setError('');

    if (!['active','disabled','suspended'].includes(status)) {
      setError('Trạng thái không hợp lệ.'); return;
    }
    if (status === 'suspended' && !suspendedUntil) {
      setError('Cần nhập thời điểm kết thúc tạm treo.'); return;
    }

    setSaving(true);
    try {
      const payload = {
        status,
        suspendedUntil: status === 'suspended'
          ? fromLocalDatetimeValue(suspendedUntil)
          : null
      };
      const updated = await UserAPI.updateUserStatus(id, payload); // ← KHÔNG truyền token
      setUser(updated);
      setMsg('Cập nhật trạng thái thành công.');
    } catch (e) {
      if (e.status === 401 || /xác thực|401/i.test(e.message)) {
        navigate('/login'); return;
      }
      setError(e.message || 'Cập nhật thất bại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>Đang tải…</div>;
  if (!user) return <div className={styles.error}>Không tìm thấy người dùng.</div>;

  // Badge theo role & status
  const roleClass = user.role === 'admin' ? styles.roleAdmin : styles.roleGuest;
  const statusClass =
    user.status === 'disabled' ? styles.statusDisabled :
    user.status === 'suspended' ? styles.statusSuspended :
    styles.statusActive;

  return (
    <div className={styles.page}>
      <PageHeader
        title="Chi tiết khách hàng"
        crumbs={[{ label:'Danh sách', to:'/admin/users-management' }, { label:'Chi tiết' }]}
      />

      <div className={styles.detailGrid}>
        {/* Card thông tin */}
        <section className={`${styles.card} ${styles.profileCard}`}>
          <div className={styles.profileHeader}>
            <img
              className={styles.avatar}
              src={user.avatarURL || '/placeholder-avatar.png'}
              alt={user.fullName || user.name || 'Avatar'}
              referrerPolicy="no-referrer"
              onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src='/placeholder-avatar.png'; }}
            />
            <div className={styles.meta}>
              <div className={styles.name}>{user.fullName || user.name || '(Chưa có tên)'}</div>
              <div className={styles.email}>{user.email}</div>
              <div className={styles.metaRow}>
                <span className={`${styles.badge} ${roleClass}`}>{user.role}</span>
                <span className={`${styles.badge} ${statusClass}`}>{user.status}</span>
                <span className={styles.muted}>ID: {user.id || user._id}</span>
              </div>
            </div>
          </div>

          <div className={styles.infoGrid}>
            <Field label="Số điện thoại" value={user.phoneNumber || '—'} />
            <Field label="Địa chỉ" value={user.address || '—'} />
            <Field label="Ngày sinh" value={user.dob ? new Date(user.dob).toLocaleDateString('vi-VN') : '—'} />
          </div>
        </section>

        {/* Card trạng thái */}
        <section className={`${styles.card} ${styles.statusCard}`}>
          <div className={styles.cardTitle}>Cập nhật trạng thái</div>

          {user.role === 'admin' && (
            <div className={`${styles.alert} ${styles.warn}`}>
              Không thể thay đổi trạng thái <b>admin</b>.
            </div>
          )}

          {!!error && <div className={`${styles.alert} ${styles.errorBox}`}>{error}</div>}
          {!!msg && <div className={`${styles.alert} ${styles.success}`}>{msg}</div>}

          <div className={styles.formRow}>
            <label className={styles.label}>Trạng thái</label>
            <select
              className={styles.input}
              value={status}
              disabled={user.role === 'admin'}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {status === 'suspended' && (
            <div className={styles.formRow}>
              <label className={styles.label}>Kết thúc tạm treo</label>
              <input
                type="datetime-local"
                className={styles.input}
                value={suspendedUntil}
                disabled={user.role === 'admin'}
                min={toLocalDatetimeValue(new Date().toISOString())}
                onChange={(e) => setSuspendedUntil(e.target.value)}
              />
              <div className={styles.hint}>Chọn thời điểm (giờ địa phương) mà tài khoản tự động mở lại.</div>
            </div>
          )}

          <div className={styles.actions}>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={onSaveStatus}
              disabled={saving || user.role === 'admin'}
            >
              {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
            <button className={styles.btn} onClick={() => load()} disabled={saving}>↻ Tải lại</button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldLabel}>{label}</div>
      <div className={styles.fieldValue}>{value}</div>
    </div>
  );
}

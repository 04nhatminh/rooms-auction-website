import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserAPI from '../../api/userApi';
import HeaderSimple from '../../components/HeaderSimple/HeaderSimple';

const isValidAvatarURL = (val) => {
  if (!val || typeof val !== 'string') return false;
  const s = val.trim();
  if (!s || s === 'null' || s === 'undefined' || s === 'about:blank') return false;
  if (s.startsWith('data:image/')) return true;
  try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
};

const passwordRequirements = [
  "Tối thiểu 8 ký tự",
  "Có chữ hoa (A-Z)",
  "Có chữ thường (a-z)",
  "Có số (0-9)",
  "Có ký tự đặc biệt (!@#$%^&*)"
];
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

const UserProfilePage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [showAvatarImg, setShowAvatarImg] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '', show: {} });
  const [status, setStatus] = useState({ profile: '', password: '' });
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await UserAPI.getProfile();
        const u = res.user;
        const safeAvatar = isValidAvatarURL(u.avatarURL) ? u.avatarURL : '';

        setProfile({
          fullName: u.fullName || '',
          email: u.email || '',
          dateOfBirth: u.dateOfBirth ? String(u.dateOfBirth).slice(0, 10) : '',
          gender: u.gender || '',
          address: u.address || '',
          phoneNumber: u.phoneNumber || '',
          avatarURL: safeAvatar
        });

        // Header user (UserMenu)
        setUser({
          id: u.id,
          fullName: u.fullName,
          name: u.fullName,
          email: u.email,
          avatarURL: safeAvatar
        });

        // Avatar card preview
        if (safeAvatar) {
          setAvatarPreview(safeAvatar);
          setShowAvatarImg(true);
        } else {
          setAvatarPreview('');       // để component hiển thị fallback chữ cái đầu
          setShowAvatarImg(false);
        }
      } catch (err) {
        alert(err.message || 'Không thể tải hồ sơ. Vui lòng đăng nhập lại.');
        navigate('/login');
      }
    };
    load();
  }, [navigate]);

  // Khi user đổi tên/ảnh trong form, đồng bộ lại header UserMenu
  useEffect(() => {
    if (!profile) return;
    setUser((prev) => ({
      ...(prev || {}),
      fullName: profile.fullName || prev?.fullName,
      name: profile.fullName || prev?.name,
      email: profile.email || prev?.email,
      avatarURL: isValidAvatarURL(profile.avatarURL) ? profile.avatarURL : ''
    }));
  }, [profile?.fullName, profile?.avatarURL, profile?.email]);

  const onChangeProfile = (key, val) => setProfile(p => ({ ...p, [key]: val }));

  const onAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setStatus(s => ({ ...s, profile: '❌ Ảnh vượt quá 2MB.' }));
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
      setShowAvatarImg(true);
      onChangeProfile('avatarURL', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(s => ({ ...s, profile: '' }));
    try {
      const payload = {
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
        avatarURL: profile.avatarURL,
        dateOfBirth: profile.dateOfBirth || null,
        gender: profile.gender || null,
        address: profile.address || null,
      };
      const res = await UserAPI.updateProfile(payload);
      const user = res.user;
      setProfile(p => ({
        ...p,
        fullName: user.fullName || p.fullName,
        avatarURL: user.avatarURL ?? p.avatarURL
      }));
      setUser(u => ({
        ...(u || {}),
        fullName: user.fullName,
        name: user.fullName,
        email: user.email,
        avatarURL: user.avatarURL ?? (u ? u.avatarURL : '')
      }));
      // Update localStorage
      const stored = JSON.parse(localStorage.getItem('userData') || '{}');
      localStorage.setItem('userData', JSON.stringify({
        ...stored,
        fullName: user.fullName,
        name: user.fullName,
        email: user.email,
        id: user.id,
        role: user.role,
        avatarURL: user.avatarURL
      }));
      setStatus(s => ({ ...s, profile: '✔️ Đã lưu thay đổi.' }));
    } catch (err) {
      setStatus(s => ({ ...s, profile: '❌ ' + (err.message || 'Lưu thất bại') }));
    } finally {
      setLoading(false);
    }
  };

  const togglePwdVisible = (key) => {
    setPwdForm(f => ({ ...f, show: { ...f.show, [key]: !f.show[key] } }));
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = pwdForm;
    setStatus(s => ({ ...s, password: '' }));
    if (!newPassword || newPassword !== confirmPassword) {
      setStatus(s => ({ ...s, password: '❌ Mật khẩu xác nhận không khớp.' }));
      return;
    }
    if (!passwordRegex.test(newPassword)) {
      setStatus(s => ({ ...s, password: '❌ Mật khẩu chưa đủ mạnh. Vui lòng kiểm tra lại các yêu cầu.' }));
      return;
    }
    if (currentPassword === newPassword) {
      setStatus(s => ({ ...s, password: '❌ Mật khẩu mới không được trùng mật khẩu cũ.' }));
      return;
    }
    setLoading(true);
    try {
      const res = await UserAPI.changePassword(currentPassword, newPassword);
      setStatus(s => ({ ...s, password: res.message || '✔️ Đổi mật khẩu thành công.' }));
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '', show: {} });
    } catch (err) {
      setStatus(s => ({ ...s, password: '❌ ' + (err.message || 'Đổi mật khẩu thất bại') }));
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <div className="min-h-dvh bg-slate-100 p-6">Đang tải...</div>;

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-800">
      <HeaderSimple />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-xl font-semibold mb-4">Quản lý Hồ sơ của bạn</h1>
        {/* Tabs */}
        <div className="mb-4 flex gap-2">
          <button
            className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium transition hover:bg-white ${tab === 'profile' ? 'bg-white text-slate-900 shadow' : ''}`}
            aria-selected={tab === 'profile'}
            onClick={() => setTab('profile')}
          >
            <i className="fa-regular fa-user align-middle" />
            Hồ sơ
          </button>
          <button
            className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium transition hover:bg-white ${tab === 'password' ? 'bg-white text-slate-900 shadow' : ''}`}
            aria-selected={tab === 'password'}
            onClick={() => setTab('password')}
          >
            <i className="fa-solid fa-key align-middle" />
            Đổi mật khẩu
          </button>
        </div>

        <div className="grid gap-6">
          {tab === 'profile' && (
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Avatar card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Ảnh đại diện</h2>
                <div className="flex items-center gap-4">
                  {showAvatarImg ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="h-24 w-24 rounded-full border border-slate-200 object-cover"
                      onError={() => setShowAvatarImg(false)}
                    />
                  ) : (
                    <div 
                      className="h-24 w-24 rounded-full border border-slate-200 bg-gradient-to-br from-[#278C9F] to-[#7CD1E5] text-white flex items-center justify-center text-2xl font-extrabold select-none"
                      style={{ 
                        borderRadius: '50%',
                        minWidth: '96px',
                        minHeight: '96px',
                        width: '96px',
                        height: '96px'
                      }}
                    >
                      {(() => {
                        if (!profile.fullName?.trim()) return 'U';
                        const names = profile.fullName.trim().split(' ');
                        // Lấy chữ cái đầu của tên cuối (lastname)
                        return names[names.length - 1].charAt(0).toUpperCase();
                      })()}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:opacity-90">
                      <i className="fa-solid fa-upload align-middle" />
                      <span>Tải ảnh lên</span>
                      <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
                    </label>
                    <p className="text-xs text-slate-500">PNG, JPG (≤ 2MB). 1:1 hiển thị đẹp nhất.</p>
                  </div>
                </div>
              </div>

              {/* Profile form */}
              <form onSubmit={saveProfile} className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Thông tin người dùng</h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Họ và tên</label>
                    <input
                      type="text"
                      required
                      value={profile.fullName}
                      onChange={e => onChangeProfile('fullName', e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Email (không đổi)</label>
                    <input
                      type="email"
                      disabled
                      value={profile.email}
                      className="w-full cursor-not-allowed rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Ngày sinh</label>
                    <input
                      type="date"
                      value={profile.dateOfBirth || ''}
                      onChange={e => onChangeProfile('dateOfBirth', e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Giới tính</label>
                    <select
                      value={profile.gender || ''}
                      onChange={e => onChangeProfile('gender', e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                    >
                      <option value="">— Chọn —</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Địa chỉ</label>
                    <textarea
                      rows={3}
                      value={profile.address || ''}
                      onChange={e => onChangeProfile('address', e.target.value)}
                      placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Số điện thoại</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="^[0-9]{9,15}$"
                      value={profile.phoneNumber || ''}
                      onChange={e => onChangeProfile('phoneNumber', e.target.value)}
                      placeholder="0901234567"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                    <p className="mt-1 text-xs text-slate-500">Chỉ số (9–15 ký tự). Không khoảng trắng.</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 h-10 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    <i className="fa-regular fa-floppy-disk align-middle" />
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 h-10 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium"
                    onClick={() => window.location.reload()}
                  >
                    <i className="fa-solid fa-rotate-right align-middle" />
                    Đặt lại
                  </button>
                  <span className="text-sm">{status.profile}</span>
                </div>
              </form>
            </section>
          )}

          {tab === 'password' && (
            <section>
              <form onSubmit={submitPassword} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Đổi mật khẩu</h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Mật khẩu hiện tại</label>
                    <div className="relative">
                      <input
                        id="currentPassword"
                        type={pwdForm.show.currentPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={pwdForm.currentPassword}
                        onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-10 text-sm outline-none focus:border-slate-900"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                        onClick={() => togglePwdVisible('currentPassword')}
                        aria-label="Hiện/ẩn mật khẩu"
                      >
                        <i className="fa-regular fa-eye" />
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Mật khẩu mới</label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={pwdForm.show.newPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={pwdForm.newPassword}
                        onFocus={() => setShowPasswordPopup(true)}
                        onBlur={() => setShowPasswordPopup(false)}
                        onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-10 text-sm outline-none focus:border-slate-900"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                        onClick={() => togglePwdVisible('newPassword')}
                        aria-label="Hiện/ẩn mật khẩu"
                      >
                        <i className="fa-regular fa-eye" />
                      </button>
                      {showPasswordPopup && (
                        <div style={{
                          position: 'absolute',
                          top: '110%',
                          left: 0,
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          padding: '16px',
                          zIndex: 10,
                          width: '320px',
                        }}>
                          <strong>Yêu cầu mật khẩu:</strong>
                          <ul style={{margin: '8px 0 0 0', padding: 0, listStyle: 'disc inside'}}>
                            {passwordRequirements.map((req, idx) => (
                              <li key={idx} style={{fontSize: '14px', color: '#374151'}}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Xác nhận mật khẩu mới</label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={pwdForm.show.confirmPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={pwdForm.confirmPassword}
                        onChange={e => setPwdForm(f => ({ ...f, confirmPassword: e.target.value }))}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-10 text-sm outline-none focus:border-slate-900"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                        onClick={() => togglePwdVisible('confirmPassword')}
                        aria-label="Hiện/ẩn mật khẩu"
                      >
                        <i className="fa-regular fa-eye" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 h-10 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    <i className="fa-solid fa-key align-middle" />
                    {loading ? 'Đang đổi…' : 'Đổi mật khẩu'}
                  </button>
                  <span className="text-sm">{status.password}</span>
                </div>
              </form>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserProfilePage;

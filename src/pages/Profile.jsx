import React, { useEffect, useState, useRef } from 'react';
import { authAPI } from '../api/services.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { Card, Button, Input } from '../components/UIComponents.jsx';
import { Camera, Lock, User as UserIcon, Mail, Phone, Save, KeyRound } from 'lucide-react';
import '../styles/profile.css';

export default function Profile() {
  const { refreshUser, user } = useAuth();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [pictureFile, setPictureFile] = useState(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '' });

  const [pwdForm, setPwdForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await authAPI.getProfile();
        setProfile(res.data);
        setForm({
          first_name: res.data.first_name || '',
          last_name: res.data.last_name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
        });
      } catch {
        addToast('Failed to load profile', 'danger');
      } finally {
        setLoading(false);
      }
    })();
  }, [addToast]);

  const handlePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPictureFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('first_name', form.first_name);
      fd.append('last_name', form.last_name);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      if (pictureFile) fd.append('profile_picture', pictureFile);

      const res = await authAPI.updateProfile(fd);
      setProfile(res.data);
      setPictureFile(null);
      setPreviewUrl(null);
      await refreshUser();
      addToast('Profile updated successfully', 'success');
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.detail || (data && Object.values(data).flat().join(' ')) || 'Update failed';
      addToast(msg, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (pwdForm.new_password !== pwdForm.confirm) {
      setPwdError("New passwords don't match");
      return;
    }
    setPwdLoading(true);
    try {
      await authAPI.changePassword({
        old_password: pwdForm.old_password,
        new_password: pwdForm.new_password,
      });
      addToast('Password changed successfully', 'success');
      setPwdForm({ old_password: '', new_password: '', confirm: '' });
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.detail || data?.old_password || (data && Object.values(data).flat().join(' ')) || 'Change failed';
      setPwdError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) return <div className="crud-page"><Card><div style={{ padding: 32 }}>Loading profile...</div></Card></div>;

  const initials = (profile?.first_name?.[0] || profile?.username?.[0] || '?').toUpperCase();
  const avatar = previewUrl || profile?.profile_picture;

  return (
    <div className="crud-page profile-page">
      <div className="crud-header">
        <div>
          <h1>My Profile</h1>
          <p>Manage your account details and security</p>
        </div>
      </div>

      <div className="profile-grid">
        <Card>
          <div className="profile-section-head">
            <UserIcon size={18} />
            <div>
              <h3>Personal information</h3>
              <p>Update your name, contact details, and profile picture.</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="profile-form">
            <div className="profile-avatar-row">
              <div className="profile-avatar">
                {avatar ? <img src={avatar} alt="profile" /> : <span>{initials}</span>}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePictureChange}
                  style={{ display: 'none' }}
                />
                <Button variant="secondary" type="button" onClick={() => fileInputRef.current?.click()}>
                  <Camera size={15} style={{ marginRight: 6 }} /> Change picture
                </Button>
                <div className="profile-avatar-hint">PNG or JPG, up to 5MB.</div>
              </div>
            </div>

            <div className="form-grid">
              <Input
                label="First name"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
              <Input
                label="Last name"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />

            <div className="profile-readonly">
              <div><span className="profile-readonly-lbl">Username</span><span>{profile?.username}</span></div>
              <div><span className="profile-readonly-lbl">Role</span><span style={{ textTransform: 'capitalize' }}>{profile?.role}</span></div>
            </div>

            <div className="modal-actions" style={{ marginTop: 8 }}>
              <Button variant="primary" type="submit" disabled={saving}>
                <Save size={15} style={{ marginRight: 6 }} />
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <div className="profile-section-head">
            <Lock size={18} />
            <div>
              <h3>Change password</h3>
              <p>Use a strong password you don't reuse elsewhere.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="profile-form">
            {pwdError && <div className="error-banner" style={{ marginBottom: 12 }}>{pwdError}</div>}
            <Input
              label="Current password"
              type="password"
              value={pwdForm.old_password}
              onChange={(e) => setPwdForm({ ...pwdForm, old_password: e.target.value })}
              required
            />
            <Input
              label="New password"
              type="password"
              value={pwdForm.new_password}
              onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
              required
            />
            <Input
              label="Confirm new password"
              type="password"
              value={pwdForm.confirm}
              onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
              required
            />
            <div className="modal-actions" style={{ marginTop: 8 }}>
              <Button variant="primary" type="submit" disabled={pwdLoading}>
                <KeyRound size={15} style={{ marginRight: 6 }} />
                {pwdLoading ? 'Updating...' : 'Update password'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

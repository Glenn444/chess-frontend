import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminStore } from '../lib/adminStore'
import { useEventStore } from '../lib/eventStore'
import { useIsMobile } from '../lib/useIsMobile'
import Icon from '../components/icons/Icon'
import logoPng from '../assets/chesske-logo.png'

/* ─── Admin Login ─── */
function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const adminLogin = useAdminStore(s => s.adminLogin)

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) { setError('Fill in both fields'); return }
    const ok = adminLogin(username, password)
    if (!ok) setError('Invalid credentials')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: 'var(--color-bg-base)',
    }}>
      <div style={{
        background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)',
        borderRadius: 20, padding: 32, maxWidth: 380, width: '100%',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src={logoPng} alt="Chesske" style={{ width: 40, height: 40, objectFit: 'contain', margin: '0 auto 12px' }} />
          <h1 className="font-display" style={{ fontSize: 24, margin: 0, fontWeight: 500 }}>Admin Panel</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>Sign in to manage Chesske</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            value={username} onChange={e => setUsername(e.target.value)}
            placeholder="Username"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', padding: '12px 14px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border-strong)', borderRadius: 12, color: 'var(--color-text-primary)', fontSize: 14, outline: 'none' }}
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', padding: '12px 14px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border-strong)', borderRadius: 12, color: 'var(--color-text-primary)', fontSize: 14, outline: 'none' }}
          />
          {error && (
            <div style={{ fontSize: 13, color: 'var(--color-red)', padding: '8px 12px', background: 'rgba(210,106,106,0.1)', borderRadius: 10, border: '1px solid rgba(210,106,106,0.25)' }}>{error}</div>
          )}
          <button onClick={handleLogin} style={{
            padding: 14, border: 'none', borderRadius: 14, cursor: 'pointer',
            background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)',
            color: '#1A1408', fontWeight: 600, fontSize: 15,
          }}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Event editor ─── */
function EventEditor({ onClose }: { onClose: () => void }) {
  const addEvent = useEventStore(s => s.addEvent)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('Tournament')
  const [prize, setPrize] = useState('')

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (!title.trim()) return
    addEvent({ title, description, image, date: date || new Date().toLocaleDateString(), type, prize })
    onClose()
  }

  const types = ['Tournament', 'Playtest', 'Community', 'Special', 'Challenge']

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(14,15,19,0.8)', backdropFilter: 'blur(4px)',
      display: 'grid', placeItems: 'center', padding: 16,
    }}>
      <div style={{
        background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)',
        borderRadius: 20, padding: 28, maxWidth: 520, width: '100%', maxHeight: '90vh', overflow: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 className="font-display" style={{ fontSize: 22, margin: 0, fontWeight: 500 }}>New Event</h2>
          <button onClick={onClose} style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-border-strong)', borderRadius: 10, width: 32, height: 32, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Title</div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title" style={{ width: '100%', padding: '10px 14px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border-strong)', borderRadius: 10, color: 'var(--color-text-primary)', fontSize: 14, outline: 'none' }} />
          </label>

          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</div>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Event description" rows={3} style={{ width: '100%', padding: '10px 14px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border-strong)', borderRadius: 10, color: 'var(--color-text-primary)', fontSize: 14, outline: 'none', resize: 'vertical' }} />
          </label>

          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Image</div>
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ color: 'var(--color-text-secondary)', fontSize: 13 }} />
            {image && <img src={image} alt="Preview" style={{ marginTop: 8, borderRadius: 10, maxHeight: 120, objectFit: 'cover' }} />}
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Date</div>
              <input value={date} onChange={e => setDate(e.target.value)} placeholder="May 20, 2026" style={{ width: '100%', padding: '10px 14px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border-strong)', borderRadius: 10, color: 'var(--color-text-primary)', fontSize: 14, outline: 'none' }} />
            </label>
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Type</div>
              <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '10px 14px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border-strong)', borderRadius: 10, color: 'var(--color-text-primary)', fontSize: 14, outline: 'none' }}>
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>

          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Prize / Reward</div>
            <input value={prize} onChange={e => setPrize(e.target.value)} placeholder="e.g. 500 Chesske coins" style={{ width: '100%', padding: '10px 14px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border-strong)', borderRadius: 10, color: 'var(--color-text-primary)', fontSize: 14, outline: 'none' }} />
          </label>

          <button onClick={handleSave} style={{
            padding: 14, border: 'none', borderRadius: 14, cursor: 'pointer',
            background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)',
            color: '#1A1408', fontWeight: 600, fontSize: 15, marginTop: 8,
          }}>
            Create Event
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Admin Dashboard ─── */
function AdminDashboard() {
  const [tab, setTab] = useState<'users' | 'events'>('users')
  const [showEditor, setShowEditor] = useState(false)
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const adminLogout = useAdminStore(s => s.adminLogout)
  const { users, toggleBan, deleteUser } = useAdminStore()
  const { events, deleteEvent } = useEventStore()

  const handleLogout = () => { adminLogout(); navigate('/') }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '12px 16px' : '16px 28px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-raised)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={logoPng} alt="Chesske" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          <span className="font-display" style={{ fontSize: 18, fontWeight: 600 }}>Admin</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => navigate('/')} style={{ background: 'var(--color-bg-elev)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-strong)', borderRadius: 10, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>View Site</button>
          <button onClick={handleLogout} style={{ background: 'rgba(210,106,106,0.12)', color: 'var(--color-red)', border: '1px solid rgba(210,106,106,0.25)', borderRadius: 10, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>Log out</button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--color-border)' }}>
        {(['users', 'events'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, maxWidth: 180, padding: '12px 20px', border: 'none', cursor: 'pointer',
            background: 'transparent', color: tab === t ? 'var(--color-amber)' : 'var(--color-text-muted)',
            borderBottom: tab === t ? '2px solid var(--color-amber)' : '2px solid transparent',
            fontWeight: 600, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5,
            transition: 'all .15s ease',
          }}>
            {t} ({t === 'users' ? users.length : events.length})
          </button>
        ))}
      </div>

      {/* Content */}
      <main style={{ padding: isMobile ? '16px' : '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
        {tab === 'users' && (
          <div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>User</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Rating</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Role</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px', fontWeight: 500 }}>{u.username}</td>
                      <td style={{ padding: '12px', color: 'var(--color-text-secondary)', fontSize: 13 }}>{u.email}</td>
                      <td style={{ padding: '12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{u.rating}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                          background: u.role === 'admin' ? 'rgba(229,169,59,0.15)' : 'var(--color-bg-elev)',
                          color: u.role === 'admin' ? 'var(--color-amber)' : 'var(--color-text-secondary)',
                        }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          color: u.banned ? 'var(--color-red)' : 'var(--color-green)', fontSize: 12, fontWeight: 600,
                        }}>
                          {u.banned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => toggleBan(u.id)} style={{
                            padding: '5px 10px', borderRadius: 8, border: '1px solid var(--color-border-strong)',
                            background: 'var(--color-bg-elev)', color: u.banned ? 'var(--color-green)' : 'var(--color-red)',
                            cursor: 'pointer', fontSize: 12, fontWeight: 500,
                          }}>
                            {u.banned ? 'Unban' : 'Ban'}
                          </button>
                          <button onClick={() => deleteUser(u.id)} style={{
                            padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(210,106,106,0.3)',
                            background: 'rgba(210,106,106,0.1)', color: 'var(--color-red)',
                            cursor: 'pointer', fontSize: 12, fontWeight: 500,
                          }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'events' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <button onClick={() => setShowEditor(true)} style={{
                padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)',
                color: '#1A1408', fontWeight: 600, fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Icon name="plus" size={16} color="#1A1408" /> New Event
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {events.map(e => (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', background: 'var(--color-bg-elev)',
                  border: '1px solid var(--color-border)', borderRadius: 14, gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{e.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{e.type} · {e.date}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
                    <span>👍 {e.likes}</span>
                    <span>💬 {e.comments.length}</span>
                  </div>
                  <button onClick={() => deleteEvent(e.id)} style={{
                    padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(210,106,106,0.3)',
                    background: 'rgba(210,106,106,0.1)', color: 'var(--color-red)',
                    cursor: 'pointer', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                  }}>
                    Delete
                  </button>
                </div>
              ))}
            </div>

            {showEditor && <EventEditor onClose={() => setShowEditor(false)} />}
          </div>
        )}
      </main>
    </div>
  )
}

/* ─── Main Admin Page ─── */
export default function Admin() {
  const isAdmin = useAdminStore(s => s.isAdmin)
  if (!isAdmin) return <AdminLogin />
  return <AdminDashboard />
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'users', label: 'Usuários' },
  { id: 'sectors', label: 'Setores' }
]

const ROLES = {
  ADMIN: 'Administrador',
  RECEPTIONIST: 'Recepcionista',
  DOCTOR: 'Médico'
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [sectors, setSectors] = useState([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [showUserForm, setShowUserForm] = useState(false)
  const [showSectorForm, setShowSectorForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editingSector, setEditingSector] = useState(null)

  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'dashboard') {
        const response = await api.get('/calls/stats')
        setStats(response.data)
      } else if (activeTab === 'users') {
        const response = await api.get('/users')
        setUsers(response.data)
      } else if (activeTab === 'sectors') {
        const response = await api.get('/sectors')
        setSectors(response.data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSaveUser = async (formData) => {
    try {
      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, formData)
      } else {
        await api.post('/users', formData)
      }
      loadData()
      setShowUserForm(false)
      setEditingUser(null)
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao salvar usuário')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Desativar este usuário?')) return
    try {
      await api.delete(`/users/${userId}`)
      loadData()
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao desativar usuário')
    }
  }

  const handleSaveSector = async (formData) => {
    try {
      if (editingSector) {
        await api.patch(`/sectors/${editingSector.id}`, formData)
      } else {
        await api.post('/sectors', formData)
      }
      loadData()
      setShowSectorForm(false)
      setEditingSector(null)
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao salvar setor')
    }
  }

  const handleDeleteSector = async (sectorId) => {
    if (!confirm('Desativar este setor?')) return
    try {
      await api.delete(`/sectors/${sectorId}`)
      loadData()
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao desativar setor')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Painel Administrativo</h1>
            <p className="text-gray-600">{user?.name}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate('/reception')} className="btn btn-secondary">
              Recepção
            </button>
            <button onClick={handleLogout} className="btn btn-danger">
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-t-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-primary-600 shadow'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 pb-8">
        <div className="card rounded-t-none">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : activeTab === 'dashboard' ? (
            <DashboardTab stats={stats} />
          ) : activeTab === 'users' ? (
            <UsersTab
              users={users}
              sectors={sectors}
              showForm={showUserForm}
              setShowForm={setShowUserForm}
              editing={editingUser}
              setEditing={setEditingUser}
              onSave={handleSaveUser}
              onDelete={handleDeleteUser}
              loadSectors={async () => {
                const res = await api.get('/sectors')
                setSectors(res.data)
              }}
            />
          ) : (
            <SectorsTab
              sectors={sectors}
              showForm={showSectorForm}
              setShowForm={setShowSectorForm}
              editing={editingSector}
              setEditing={setEditingSector}
              onSave={handleSaveSector}
              onDelete={handleDeleteSector}
            />
          )}
        </div>
      </main>
    </div>
  )
}

function DashboardTab({ stats }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Estatísticas do Dia</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-xl p-6 text-center">
          <p className="text-4xl font-bold text-blue-600">{stats?.totalTickets || 0}</p>
          <p className="text-gray-600 mt-2">Total de Senhas</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-6 text-center">
          <p className="text-4xl font-bold text-amber-600">{stats?.waitingReception || 0}</p>
          <p className="text-gray-600 mt-2">Aguardando Recepção</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-6 text-center">
          <p className="text-4xl font-bold text-purple-600">{stats?.waitingSector || 0}</p>
          <p className="text-gray-600 mt-2">Aguardando Setor</p>
        </div>
        <div className="bg-green-50 rounded-xl p-6 text-center">
          <p className="text-4xl font-bold text-green-600">{stats?.completed || 0}</p>
          <p className="text-gray-600 mt-2">Finalizados</p>
        </div>
      </div>
    </div>
  )
}

function UsersTab({ users, sectors, showForm, setShowForm, editing, setEditing, onSave, onDelete, loadSectors }) {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'RECEPTIONIST', desk: '', sectorId: ''
  })

  useEffect(() => {
    if (editing) {
      setFormData({
        name: editing.name,
        email: editing.email,
        password: '',
        role: editing.role,
        desk: editing.desk || '',
        sectorId: editing.sector?.id || ''
      })
    } else {
      setFormData({ name: '', email: '', password: '', role: 'RECEPTIONIST', desk: '', sectorId: '' })
    }
  }, [editing])

  useEffect(() => {
    if (showForm && sectors.length === 0) {
      loadSectors()
    }
  }, [showForm])

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = { ...formData }
    if (!data.password) delete data.password
    if (!data.desk) delete data.desk
    if (!data.sectorId) delete data.sectorId
    onSave(data)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Usuários</h2>
        <button
          onClick={() => { setShowForm(true); setEditing(null) }}
          className="btn btn-primary"
        >
          + Novo Usuário
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-bold mb-4">{editing ? 'Editar' : 'Novo'} Usuário</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Senha {editing && '(deixe vazio para manter)'}</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                required={!editing}
              />
            </div>
            <div>
              <label className="label">Função</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="input"
              >
                <option value="RECEPTIONIST">Recepcionista</option>
                <option value="DOCTOR">Médico</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            {formData.role === 'RECEPTIONIST' && (
              <div>
                <label className="label">Guichê</label>
                <input
                  type="text"
                  value={formData.desk}
                  onChange={(e) => setFormData({ ...formData, desk: e.target.value })}
                  className="input"
                  placeholder="Ex: Guichê 1"
                />
              </div>
            )}
            {formData.role === 'DOCTOR' && (
              <div>
                <label className="label">Setor</label>
                <select
                  value={formData.sectorId}
                  onChange={(e) => setFormData({ ...formData, sectorId: e.target.value })}
                  className="input"
                >
                  <option value="">Selecione...</option>
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary">Salvar</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="btn btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3">Nome</th>
            <th className="text-left py-3">Email</th>
            <th className="text-left py-3">Função</th>
            <th className="text-left py-3">Setor/Guichê</th>
            <th className="text-left py-3">Status</th>
            <th className="text-right py-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b hover:bg-gray-50">
              <td className="py-3">{u.name}</td>
              <td className="py-3">{u.email}</td>
              <td className="py-3">{ROLES[u.role]}</td>
              <td className="py-3">{u.sector?.name || u.desk || '-'}</td>
              <td className="py-3">
                <span className={`px-2 py-1 rounded text-xs ${u.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {u.active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="py-3 text-right">
                <button onClick={() => { setEditing(u); setShowForm(true) }} className="text-primary-600 hover:underline mr-4">
                  Editar
                </button>
                <button onClick={() => onDelete(u.id)} className="text-red-600 hover:underline">
                  Desativar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SectorsTab({ sectors, showForm, setShowForm, editing, setEditing, onSave, onDelete }) {
  const [formData, setFormData] = useState({ name: '', room: '', type: 'CONSULTATION' })

  useEffect(() => {
    if (editing) {
      setFormData({ name: editing.name, room: editing.room, type: editing.type })
    } else {
      setFormData({ name: '', room: '', type: 'CONSULTATION' })
    }
  }, [editing])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Setores</h2>
        <button onClick={() => { setShowForm(true); setEditing(null) }} className="btn btn-primary">
          + Novo Setor
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-bold mb-4">{editing ? 'Editar' : 'Novo'} Setor</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="Ex: Cardiologia"
                required
              />
            </div>
            <div>
              <label className="label">Sala</label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="input"
                placeholder="Ex: Sala 101"
                required
              />
            </div>
            <div>
              <label className="label">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input"
              >
                <option value="CONSULTATION">Consulta</option>
                <option value="EMERGENCY">Emergência</option>
                <option value="OTHER">Outro</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary">Salvar</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="btn btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3">Nome</th>
            <th className="text-left py-3">Sala</th>
            <th className="text-left py-3">Tipo</th>
            <th className="text-left py-3">Status</th>
            <th className="text-right py-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {sectors.map((s) => (
            <tr key={s.id} className="border-b hover:bg-gray-50">
              <td className="py-3">{s.name}</td>
              <td className="py-3">{s.room}</td>
              <td className="py-3">
                {s.type === 'CONSULTATION' ? 'Consulta' : s.type === 'EMERGENCY' ? 'Emergência' : 'Outro'}
              </td>
              <td className="py-3">
                <span className={`px-2 py-1 rounded text-xs ${s.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {s.active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="py-3 text-right">
                <button onClick={() => { setEditing(s); setShowForm(true) }} className="text-primary-600 hover:underline mr-4">
                  Editar
                </button>
                <button onClick={() => onDelete(s.id)} className="text-red-600 hover:underline">
                  Desativar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

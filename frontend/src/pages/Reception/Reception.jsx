import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { useSound } from '../../hooks/useSound'
import api from '../../services/api'

const STATUS_LABELS = {
  WAITING_RECEPTION: 'Aguardando',
  IN_RECEPTION: 'Em atendimento',
  WAITING_SECTOR: 'Encaminhado',
  IN_SECTOR: 'Com médico',
  COMPLETED: 'Finalizado',
  CANCELLED: 'Cancelado'
}

const TYPE_LABELS = {
  CONSULTATION: 'Consulta',
  EMERGENCY: 'Pronto Atendimento',
  PRIORITY: 'Prioridade'
}

export default function Reception() {
  const [tickets, setTickets] = useState([])
  const [sectors, setSectors] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [patientName, setPatientName] = useState('')
  const [selectedSector, setSelectedSector] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const { user, logout } = useAuth()
  const { socket, connected, joinRoom, leaveRoom } = useSocket()
  const { playNotification } = useSound()
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  // Join reception room when socket connects
  useEffect(() => {
    if (connected) {
      joinRoom('reception')
    }

    return () => {
      if (connected) {
        leaveRoom('reception')
      }
    }
  }, [connected])

  useEffect(() => {
    if (socket) {
      socket.on('new-ticket', (ticket) => {
        setTickets(prev => {
          // Sort: Priority first, then by creation time
          const updated = [...prev, ticket]
          return updated.sort((a, b) => {
            if (a.type === 'PRIORITY' && b.type !== 'PRIORITY') return -1
            if (a.type !== 'PRIORITY' && b.type === 'PRIORITY') return 1
            return new Date(a.createdAt) - new Date(b.createdAt)
          })
        })
        playNotification()
      })

      socket.on('ticket-updated', (updatedTicket) => {
        setTickets(prev =>
          prev.map(t => t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t)
        )
      })

      socket.on('ticket-completed', (ticket) => {
        setTickets(prev => prev.filter(t => t.id !== ticket.id))
      })

      return () => {
        socket.off('new-ticket')
        socket.off('ticket-updated')
        socket.off('ticket-completed')
      }
    }
  }, [socket])

  const loadData = async () => {
    try {
      const [ticketsRes, sectorsRes] = await Promise.all([
        api.get('/tickets', { params: { today: true } }),
        api.get('/sectors', { params: { active: true } })
      ])

      // Filter only waiting or in-reception tickets
      const filteredTickets = ticketsRes.data.filter(t =>
        ['WAITING_RECEPTION', 'IN_RECEPTION'].includes(t.status)
      )

      setTickets(filteredTickets)
      setSectors(sectorsRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCall = async (ticket) => {
    setActionLoading(true)
    try {
      await api.patch(`/tickets/${ticket.id}/call`)
      setSelectedTicket(ticket)
      setPatientName('')
      setSelectedSector('')
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao chamar paciente')
    } finally {
      setActionLoading(false)
    }
  }

  const handleForward = async () => {
    if (!patientName.trim()) {
      alert('Digite o nome do paciente')
      return
    }
    if (!selectedSector) {
      alert('Selecione o setor de destino')
      return
    }

    setActionLoading(true)
    try {
      await api.patch(`/tickets/${selectedTicket.id}/forward`, {
        patientName: patientName.trim(),
        sectorId: selectedSector
      })

      setTickets(prev => prev.filter(t => t.id !== selectedTicket.id))
      setSelectedTicket(null)
      setPatientName('')
      setSelectedSector('')
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao encaminhar paciente')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async (ticketId) => {
    if (!confirm('Tem certeza que deseja cancelar esta senha?')) return

    try {
      await api.patch(`/tickets/${ticketId}/cancel`)
      setTickets(prev => prev.filter(t => t.id !== ticketId))
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null)
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao cancelar senha')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Painel da Recepção</h1>
            <p className="text-gray-600">{user?.name} - {user?.desk || 'Guichê'}</p>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary">
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ticket List */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Fila de Espera ({tickets.filter(t => t.status === 'WAITING_RECEPTION').length})
              </h2>

              {tickets.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhum paciente na fila
                </p>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        ticket.status === 'IN_RECEPTION'
                          ? 'border-primary-500 bg-primary-50'
                          : ticket.type === 'PRIORITY'
                          ? 'border-amber-300 bg-amber-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-bold text-gray-800">
                            {ticket.number}
                          </span>
                          <div>
                            <p className="text-gray-600">CPF: {ticket.cpfPrefix}***</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              ticket.type === 'PRIORITY'
                                ? 'bg-amber-200 text-amber-800'
                                : ticket.type === 'EMERGENCY'
                                ? 'bg-red-200 text-red-800'
                                : 'bg-blue-200 text-blue-800'
                            }`}>
                              {TYPE_LABELS[ticket.type]}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {ticket.status === 'WAITING_RECEPTION' && (
                            <button
                              onClick={() => handleCall(ticket)}
                              disabled={actionLoading}
                              className="btn btn-primary"
                            >
                              Chamar
                            </button>
                          )}
                          {ticket.status === 'IN_RECEPTION' && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                              Em atendimento
                            </span>
                          )}
                          <button
                            onClick={() => handleCancel(ticket.id)}
                            className="btn btn-danger text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Forward Form */}
          <div>
            <div className="card sticky top-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Encaminhar Paciente
              </h2>

              {selectedTicket ? (
                <div className="space-y-4">
                  <div className="p-4 bg-primary-50 rounded-lg">
                    <p className="text-sm text-gray-600">Senha</p>
                    <p className="text-3xl font-bold text-primary-600">
                      {selectedTicket.number}
                    </p>
                    <p className="text-gray-600">CPF: {selectedTicket.cpfPrefix}***</p>
                  </div>

                  <div>
                    <label className="label">Nome Completo do Paciente</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="input"
                      placeholder="Digite o nome completo"
                    />
                  </div>

                  <div>
                    <label className="label">Setor / Médico</label>
                    <select
                      value={selectedSector}
                      onChange={(e) => setSelectedSector(e.target.value)}
                      className="input"
                    >
                      <option value="">Selecione...</option>
                      {sectors.map((sector) => (
                        <option key={sector.id} value={sector.id}>
                          {sector.name} - {sector.room}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleForward}
                    disabled={actionLoading || !patientName.trim() || !selectedSector}
                    className="btn btn-success w-full py-3"
                  >
                    {actionLoading ? 'Encaminhando...' : 'Encaminhar'}
                  </button>

                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="btn btn-secondary w-full"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Chame um paciente para atender
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { useSound } from '../../hooks/useSound'
import api from '../../services/api'

const TYPE_LABELS = {
  CONSULTATION: 'Consulta',
  EMERGENCY: 'Pronto Atendimento',
  PRIORITY: 'Prioridade'
}

export default function Sector() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const { user, logout } = useAuth()
  const { socket, connected, joinRoom, leaveRoom } = useSocket()
  const { playNotification } = useSound()
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.sectorId) {
      loadTickets()
    } else {
      setLoading(false)
    }
  }, [user])

  // Join sector room when socket connects
  useEffect(() => {
    if (connected && user?.sectorId) {
      joinRoom(`sector-${user.sectorId}`)
    }

    return () => {
      if (connected && user?.sectorId) {
        leaveRoom(`sector-${user.sectorId}`)
      }
    }
  }, [connected, user?.sectorId])

  useEffect(() => {
    if (socket && user?.sectorId) {
      socket.on('ticket-forwarded', (ticket) => {
        if (ticket.sectorId === user.sectorId) {
          setTickets(prev => {
            const updated = [...prev, ticket]
            return updated.sort((a, b) => {
              if (a.type === 'PRIORITY' && b.type !== 'PRIORITY') return -1
              if (a.type !== 'PRIORITY' && b.type === 'PRIORITY') return 1
              return new Date(a.forwardedAt) - new Date(b.forwardedAt)
            })
          })
          playNotification()
        }
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
        socket.off('ticket-forwarded')
        socket.off('ticket-updated')
        socket.off('ticket-completed')
      }
    }
  }, [socket, user])

  const loadTickets = async () => {
    try {
      const response = await api.get('/tickets', {
        params: {
          sectorId: user.sectorId,
          today: true
        }
      })

      // Filter only waiting or in-sector tickets
      const filteredTickets = response.data.filter(t =>
        ['WAITING_SECTOR', 'IN_SECTOR'].includes(t.status)
      )

      setTickets(filteredTickets)
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCall = async (ticket) => {
    setActionLoading(true)
    try {
      await api.patch(`/tickets/${ticket.id}/call-sector`)
      // Ticket will be updated via socket
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao chamar paciente')
    } finally {
      setActionLoading(false)
    }
  }

  const handleComplete = async (ticket) => {
    if (!confirm('Finalizar atendimento deste paciente?')) return

    setActionLoading(true)
    try {
      await api.patch(`/tickets/${ticket.id}/complete`)
      setTickets(prev => prev.filter(t => t.id !== ticket.id))
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao finalizar atendimento')
    } finally {
      setActionLoading(false)
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

  if (!user?.sectorId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="card text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Setor não configurado</h2>
          <p className="text-gray-600 mb-4">
            Seu usuário não está vinculado a nenhum setor.
            Entre em contato com o administrador.
          </p>
          <button onClick={handleLogout} className="btn btn-primary">
            Sair
          </button>
        </div>
      </div>
    )
  }

  const waitingTickets = tickets.filter(t => t.status === 'WAITING_SECTOR')
  const inProgressTickets = tickets.filter(t => t.status === 'IN_SECTOR')

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {user.sector?.name || 'Setor'}
            </h1>
            <p className="text-gray-600">
              {user.name} - {user.sector?.room || 'Sala'}
            </p>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary">
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Waiting Queue */}
          <div>
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Aguardando Chamada ({waitingTickets.length})
              </h2>

              {waitingTickets.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhum paciente aguardando
                </p>
              ) : (
                <div className="space-y-3">
                  {waitingTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`p-4 rounded-lg border-2 ${
                        ticket.type === 'PRIORITY'
                          ? 'border-amber-300 bg-amber-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xl font-bold text-gray-800">
                            {ticket.patientName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-gray-600">
                              Senha: {ticket.number}
                            </span>
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

                        <button
                          onClick={() => handleCall(ticket)}
                          disabled={actionLoading}
                          className="btn btn-primary btn-lg"
                        >
                          Chamar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* In Progress */}
          <div>
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Em Atendimento ({inProgressTickets.length})
              </h2>

              {inProgressTickets.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhum paciente em atendimento
                </p>
              ) : (
                <div className="space-y-3">
                  {inProgressTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 rounded-lg border-2 border-green-400 bg-green-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xl font-bold text-gray-800">
                            {ticket.patientName}
                          </p>
                          <p className="text-gray-600">
                            Senha: {ticket.number}
                          </p>
                          <p className="text-green-600 text-sm mt-1">
                            Em atendimento
                          </p>
                        </div>

                        <button
                          onClick={() => handleComplete(ticket)}
                          disabled={actionLoading}
                          className="btn btn-success btn-lg"
                        >
                          Finalizar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats Card */}
            <div className="card mt-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Estatísticas do Dia
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">
                    {waitingTickets.length}
                  </p>
                  <p className="text-gray-600">Aguardando</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">
                    {inProgressTickets.length}
                  </p>
                  <p className="text-gray-600">Em Atendimento</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useSocket } from '../../contexts/SocketContext'
import { useSound } from '../../hooks/useSound'
import api from '../../services/api'

export default function Display() {
  const [receptionCalls, setReceptionCalls] = useState([])
  const [sectorCalls, setSectorCalls] = useState([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [newCall, setNewCall] = useState(null)

  const { socket, connected, joinRoom, leaveRoom } = useSocket()
  const { playNotification } = useSound()

  useEffect(() => {
    loadCalls()

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  // Join display room when socket connects
  useEffect(() => {
    if (connected) {
      joinRoom('display')
    }

    return () => {
      if (connected) {
        leaveRoom('display')
      }
    }
  }, [connected])

  useEffect(() => {
    if (socket) {
      socket.on('call-reception', (call) => {
        setNewCall({ type: 'reception', data: call })
        playNotification()

        setReceptionCalls(prev => {
          const updated = [call, ...prev.filter(c => c.id !== call.id)]
          return updated.slice(0, 5)
        })

        // Clear highlight after 5 seconds
        setTimeout(() => {
          setNewCall(null)
        }, 5000)
      })

      socket.on('call-sector', (call) => {
        setNewCall({ type: 'sector', data: call })
        playNotification()

        setSectorCalls(prev => {
          const updated = [call, ...prev.filter(c => c.id !== call.id)]
          return updated.slice(0, 5)
        })

        // Clear highlight after 5 seconds
        setTimeout(() => {
          setNewCall(null)
        }, 5000)
      })

      return () => {
        socket.off('call-reception')
        socket.off('call-sector')
      }
    }
  }, [socket])

  const loadCalls = async () => {
    try {
      const [receptionRes, sectorRes] = await Promise.all([
        api.get('/calls', { params: { type: 'RECEPTION', limit: 5 } }),
        api.get('/calls', { params: { type: 'SECTOR', limit: 5 } })
      ])

      setReceptionCalls(receptionRes.data)
      setSectorCalls(sectorRes.data)
    } catch (error) {
      console.error('Error loading calls:', error)
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Clínica Médica</h1>
        <div className="text-6xl font-bold text-primary-400">
          {formatTime(currentTime)}
        </div>
        <p className="text-gray-400 mt-2 capitalize">
          {formatDate(currentTime)}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {/* Reception Calls */}
        <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur">
          <h2 className="text-2xl font-bold text-blue-400 mb-6 flex items-center">
            <span className="w-3 h-3 bg-blue-400 rounded-full mr-3 animate-pulse"></span>
            Recepção
          </h2>

          {receptionCalls.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-xl">
              Aguardando chamadas...
            </p>
          ) : (
            <div className="space-y-4">
              {receptionCalls.map((call, index) => (
                <div
                  key={call.id}
                  className={`rounded-xl p-6 transition-all duration-500 ${
                    index === 0 && newCall?.type === 'reception' && newCall?.data?.id === call.id
                      ? 'bg-blue-600 animate-pulse scale-105'
                      : index === 0
                      ? 'bg-blue-600'
                      : 'bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-bold ${index === 0 ? 'text-4xl' : 'text-2xl'}`}>
                        {call.ticket?.number}
                      </p>
                      <p className={`text-blue-200 ${index === 0 ? 'text-xl' : 'text-sm'}`}>
                        CPF: {call.ticket?.cpfPrefix}***
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${index === 0 ? 'text-2xl' : 'text-lg'}`}>
                        {call.desk}
                      </p>
                      {index === 0 && (
                        <p className="text-blue-200 text-sm mt-1">
                          Dirija-se ao guichê
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sector Calls */}
        <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur">
          <h2 className="text-2xl font-bold text-green-400 mb-6 flex items-center">
            <span className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></span>
            Consultórios
          </h2>

          {sectorCalls.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-xl">
              Aguardando chamadas...
            </p>
          ) : (
            <div className="space-y-4">
              {sectorCalls.map((call, index) => (
                <div
                  key={call.id}
                  className={`rounded-xl p-6 transition-all duration-500 ${
                    index === 0 && newCall?.type === 'sector' && newCall?.data?.id === call.id
                      ? 'bg-green-600 animate-pulse scale-105'
                      : index === 0
                      ? 'bg-green-600'
                      : 'bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-bold ${index === 0 ? 'text-3xl' : 'text-xl'}`}>
                        {call.ticket?.patientName}
                      </p>
                      <p className={`text-green-200 ${index === 0 ? 'text-lg' : 'text-sm'}`}>
                        Senha: {call.ticket?.number}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${index === 0 ? 'text-2xl' : 'text-lg'}`}>
                        {call.room}
                      </p>
                      <p className={`text-green-200 ${index === 0 ? 'text-lg' : 'text-sm'}`}>
                        {call.ticket?.sector?.name}
                      </p>
                      {index === 0 && (
                        <p className="text-green-200 text-sm mt-1">
                          {call.user?.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center mt-12 text-gray-500">
        <p>Sistema de Senhas - Clínica Médica</p>
      </footer>
    </div>
  )
}

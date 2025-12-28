import { useState } from 'react'
import api from '../../services/api'

const TICKET_TYPES = [
  {
    id: 'CONSULTATION',
    label: 'Consulta',
    description: 'Consultas médicas agendadas',
    color: 'bg-blue-500 hover:bg-blue-600',
    icon: '🏥'
  },
  {
    id: 'EMERGENCY',
    label: 'Pronto Atendimento',
    description: 'Atendimento de urgência',
    color: 'bg-red-500 hover:bg-red-600',
    icon: '🚑'
  },
  {
    id: 'PRIORITY',
    label: 'Prioridade',
    description: 'Idosos, gestantes, PCD',
    color: 'bg-amber-500 hover:bg-amber-600',
    icon: '⭐'
  }
]

export default function Totem() {
  const [step, setStep] = useState('select') // select, cpf, confirm
  const [selectedType, setSelectedType] = useState(null)
  const [cpf, setCpf] = useState('')
  const [ticket, setTicket] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTypeSelect = (type) => {
    setSelectedType(type)
    setStep('cpf')
    setCpf('')
  }

  const handleCpfInput = (digit) => {
    if (cpf.length < 5) {
      setCpf(cpf + digit)
    }
  }

  const handleCpfDelete = () => {
    setCpf(cpf.slice(0, -1))
  }

  const handleCpfClear = () => {
    setCpf('')
  }

  const handleBack = () => {
    setStep('select')
    setSelectedType(null)
    setCpf('')
    setError('')
  }

  const handleConfirm = async () => {
    if (cpf.length !== 5) {
      setError('Digite os 5 primeiros dígitos do CPF')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.post('/tickets', {
        cpfPrefix: cpf,
        type: selectedType.id
      })

      setTicket(response.data)
      setStep('confirm')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao gerar senha')
    } finally {
      setLoading(false)
    }
  }

  const handleNewTicket = () => {
    setStep('select')
    setSelectedType(null)
    setCpf('')
    setTicket(null)
    setError('')
  }

  // Type selection screen
  if (step === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Bem-vindo
        </h1>
        <p className="text-xl text-gray-300 mb-12">
          Selecione o tipo de atendimento
        </p>

        <div className="grid gap-6 w-full max-w-2xl">
          {TICKET_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => handleTypeSelect(type)}
              className={`totem-button ${type.color} text-white shadow-lg`}
            >
              <span className="text-4xl mr-4">{type.icon}</span>
              <span className="flex flex-col items-start">
                <span className="text-2xl">{type.label}</span>
                <span className="text-sm opacity-80">{type.description}</span>
              </span>
            </button>
          ))}
        </div>

        <p className="text-gray-500 mt-12 text-sm">
          Sistema de Senhas - Clínica Médica
        </p>
      </div>
    )
  }

  // CPF input screen
  if (step === 'cpf') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center p-8">
        <button
          onClick={handleBack}
          className="absolute top-8 left-8 text-white text-lg hover:text-gray-300"
        >
          ← Voltar
        </button>

        <div className={`inline-flex items-center px-6 py-3 rounded-full ${selectedType.color} text-white mb-8`}>
          <span className="text-2xl mr-2">{selectedType.icon}</span>
          <span className="text-xl font-medium">{selectedType.label}</span>
        </div>

        <h2 className="text-3xl font-bold text-white mb-4">
          Digite os 5 primeiros dígitos do CPF
        </h2>

        {error && (
          <div className="bg-red-500 text-white px-6 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* CPF Display */}
        <div className="flex gap-4 mb-8">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-16 h-20 md:w-20 md:h-24 bg-white rounded-xl flex items-center justify-center text-4xl md:text-5xl font-bold text-gray-800"
            >
              {cpf[i] || ''}
            </div>
          ))}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-4 max-w-sm">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleCpfInput(String(num))}
              className="w-20 h-20 md:w-24 md:h-24 bg-white hover:bg-gray-100 rounded-xl text-3xl font-bold text-gray-800 transition-all active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleCpfClear}
            className="w-20 h-20 md:w-24 md:h-24 bg-red-500 hover:bg-red-600 rounded-xl text-lg font-bold text-white transition-all active:scale-95"
          >
            Limpar
          </button>
          <button
            onClick={() => handleCpfInput('0')}
            className="w-20 h-20 md:w-24 md:h-24 bg-white hover:bg-gray-100 rounded-xl text-3xl font-bold text-gray-800 transition-all active:scale-95"
          >
            0
          </button>
          <button
            onClick={handleCpfDelete}
            className="w-20 h-20 md:w-24 md:h-24 bg-gray-600 hover:bg-gray-700 rounded-xl text-lg font-bold text-white transition-all active:scale-95"
          >
            ⌫
          </button>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={cpf.length !== 5 || loading}
          className={`mt-8 px-12 py-4 rounded-xl text-2xl font-bold transition-all ${
            cpf.length === 5 && !loading
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? 'Gerando...' : 'Confirmar'}
        </button>
      </div>
    )
  }

  // Confirmation screen
  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-6">✓</div>

        <h2 className="text-3xl font-bold text-white mb-8">
          Sua senha foi gerada!
        </h2>

        <div className="bg-white rounded-3xl p-8 shadow-2xl mb-8">
          <p className="text-gray-600 text-lg mb-2">Sua senha é</p>
          <p className="text-7xl md:text-8xl font-bold text-gray-800">
            {ticket?.number}
          </p>
          <p className="text-gray-500 mt-4">
            CPF: {ticket?.cpfPrefix}***
          </p>
        </div>

        <p className="text-white text-xl mb-8">
          Aguarde ser chamado no painel
        </p>

        <button
          onClick={handleNewTicket}
          className="px-8 py-4 bg-white text-green-700 rounded-xl text-xl font-bold hover:bg-gray-100 transition-all"
        >
          Nova Senha
        </button>

        <p className="text-green-200 mt-12 text-sm">
          Esta tela será fechada automaticamente em alguns segundos
        </p>
      </div>
    )
  }

  return null
}

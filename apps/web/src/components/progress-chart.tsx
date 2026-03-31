'use client'

import { useEffect, useRef } from 'react'

interface ProgressData {
  date: string
  accuracy: number
  correct: number
  errors: number
}

interface ProgressChartProps {
  data: ProgressData[]
  sessions: number
  accuracy: number
  avgReaction: number
  avgLevel: number
}

export function ProgressChart({ data, sessions, accuracy, avgReaction, avgLevel }: ProgressChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    drawChart(ctx, canvas, data, { sessions, accuracy, avgReaction, avgLevel })
  }, [data, sessions, accuracy, avgReaction, avgLevel])

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={280}
      className="w-full max-w-full h-auto"
    />
  )
}

function drawChart(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  progressByDay: ProgressData[],
  gp: { sessions: number; accuracy: number; avgReaction: number; avgLevel: number }
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (!progressByDay || progressByDay.length === 0) {
    // Gráfico simples de barras com métricas gerais
    const labels = ['Sessões', 'Acerto %', 'Reação s', 'Nível']
    const avgReactionSec = gp.avgReaction / 1000
    const values = [gp.sessions, gp.accuracy * 100, avgReactionSec, gp.avgLevel]
    const max = Math.max(1, ...values)
    const w = canvas.width
    const h = canvas.height
    const pad = 40
    const barW = ((w - pad * 2) / values.length) * 0.6

    ctx.font = '14px Inter, sans-serif'
    ctx.fillStyle = '#3a5144'
    ctx.strokeStyle = '#234c38'

    // Eixos
    ctx.beginPath()
    ctx.moveTo(pad, pad)
    ctx.lineTo(pad, h - pad)
    ctx.lineTo(w - pad, h - pad)
    ctx.stroke()

    values.forEach((v, i) => {
      const x = pad + (i + 0.5) * ((w - pad * 2) / values.length) - barW / 2
      const y = h - pad
      const bh = (v / max) * (h - pad * 2)

      // Barra com gradiente
      const grad = ctx.createLinearGradient(0, y - bh, 0, y)
      grad.addColorStop(0, '#234c38')
      grad.addColorStop(1, '#5a8f7b')
      ctx.fillStyle = grad
      ctx.fillRect(x, y - bh, barW, bh)

      // Label
      ctx.fillStyle = '#1b2b21'
      ctx.textAlign = 'center'
      ctx.fillText(labels[i], x + barW / 2, y + 18)

      // Valor no topo da barra
      ctx.fillStyle = '#234c38'
      ctx.font = 'bold 12px Inter, sans-serif'
      ctx.fillText(v.toFixed(1), x + barW / 2, y - bh - 5)
      ctx.font = '14px Inter, sans-serif'
    })
    return
  }

  // Gráfico de evolução por dia (linha)
  const w = canvas.width
  const h = canvas.height
  const pad = 50
  const chartW = w - pad * 2
  const chartH = h - pad * 2

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    const day = date.getDate()
    const month = date.getMonth() + 1
    return `${day}/${month}`
  }

  // Dados de acurácia
  const accuracyData = progressByDay.map((d) => d.accuracy * 100)
  const maxAccuracy = Math.max(100, ...accuracyData, 1)
  const minAccuracy = Math.min(...accuracyData, 0)
  const range = maxAccuracy - minAccuracy || 100

  ctx.font = '12px Inter, sans-serif'
  ctx.fillStyle = '#3a5144'
  ctx.strokeStyle = '#234c38'

  // Eixos
  ctx.beginPath()
  ctx.moveTo(pad, pad)
  ctx.lineTo(pad, h - pad)
  ctx.lineTo(w - pad, h - pad)
  ctx.stroke()

  // Escala do eixo Y (acurácia %)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#666'
  const ySteps = 5
  for (let i = 0; i <= ySteps; i++) {
    const y = pad + (chartH / ySteps) * (ySteps - i)
    const value = minAccuracy + (range / ySteps) * i
    ctx.fillText(Math.round(value) + '%', pad - 8, y + 4)

    // Grid
    ctx.strokeStyle = '#e0e0e0'
    ctx.beginPath()
    ctx.moveTo(pad, y)
    ctx.lineTo(w - pad, y)
    ctx.stroke()
    ctx.strokeStyle = '#234c38'
  }

  // Linha de evolução
  ctx.strokeStyle = '#234c38'
  ctx.lineWidth = 3
  ctx.beginPath()

  const pointSpacing = chartW / Math.max(1, progressByDay.length - 1)

  progressByDay.forEach((day, i) => {
    const x = pad + i * pointSpacing
    const accuracy = day.accuracy * 100
    const y = pad + chartH - ((accuracy - minAccuracy) / range) * chartH

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()

  // Pontos
  ctx.fillStyle = '#234c38'
  progressByDay.forEach((day, i) => {
    const x = pad + i * pointSpacing
    const accuracy = day.accuracy * 100
    const y = pad + chartH - ((accuracy - minAccuracy) / range) * chartH

    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()

    // Valor no primeiro e último dia
    if (i === 0 || i === progressByDay.length - 1) {
      ctx.fillStyle = '#234c38'
      ctx.font = 'bold 10px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(Math.round(accuracy) + '%', x, y - 12)
      ctx.fillStyle = '#234c38'
      ctx.font = '12px Inter, sans-serif'
    }
  })

  // Labels do eixo X (datas)
  ctx.textAlign = 'center'
  ctx.fillStyle = '#666'
  ctx.font = '10px Inter, sans-serif'

  const labelIndices: number[] = []
  if (progressByDay.length > 0) labelIndices.push(0)
  if (progressByDay.length > 1) labelIndices.push(progressByDay.length - 1)
  if (progressByDay.length > 2) {
    const mid = Math.floor(progressByDay.length / 2)
    if (!labelIndices.includes(mid)) labelIndices.push(mid)
  }

  labelIndices.forEach((i) => {
    const x = pad + i * pointSpacing
    const dateStr = formatDate(progressByDay[i].date)
    ctx.fillText(dateStr, x, h - pad + 20)

    // Marca no eixo
    ctx.strokeStyle = '#234c38'
    ctx.beginPath()
    ctx.moveTo(x, h - pad)
    ctx.lineTo(x, h - pad + 5)
    ctx.stroke()
  })

  // Título
  ctx.fillStyle = '#1b2b21'
  ctx.font = 'bold 14px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Evolução da Acurácia (%)', w / 2, pad - 10)

  // Legenda
  ctx.font = '11px Inter, sans-serif'
  ctx.fillStyle = '#666'
  ctx.textAlign = 'left'
  if (progressByDay.length > 0) {
    const firstDay = formatDate(progressByDay[0].date)
    const lastDay = formatDate(progressByDay[progressByDay.length - 1].date)
    ctx.fillText(`Primeiro dia: ${firstDay} → Último dia: ${lastDay}`, pad, h - pad + 40)
  }
}

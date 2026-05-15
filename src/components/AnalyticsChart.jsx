import { useState, useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import './AnalyticsChart.css'

Chart.register(...registerables)

// ── Builds real chart data from Firebase bookings ──
function buildData(bookings) {
  const now = new Date()

  const weeklyRevenue   = Array(7).fill(0)
  const weeklyBookings  = Array(7).fill(0)
  const monthlyRevenue  = Array(12).fill(0)
  const monthlyBookings = Array(12).fill(0)
  const yearlyMap       = {}

  bookings.forEach(b => {
    if (!b.createdAt) return
    const d = new Date(b.createdAt)

    // ── Feature 3: use paymentStatus === 'paid' for revenue ──
    const isPaid = b.paymentStatus === 'paid'

    // Weekly — last 7 days
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24))
    if (diffDays < 7) {
      const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1
      weeklyBookings[dayIndex]++
      if (isPaid) weeklyRevenue[dayIndex] += Number(b.total)
    }

    // Monthly — this year only
    if (d.getFullYear() === now.getFullYear()) {
      monthlyBookings[d.getMonth()]++
      if (isPaid) monthlyRevenue[d.getMonth()] += Number(b.total)
    }

    // Yearly — all time
    const yr = d.getFullYear().toString()
    if (!yearlyMap[yr]) yearlyMap[yr] = { revenue: 0, bookings: 0 }
    yearlyMap[yr].bookings++
    if (isPaid) yearlyMap[yr].revenue += Number(b.total)
  })

  const yearLabels   = Object.keys(yearlyMap).sort()
  const yearRevenue  = yearLabels.map(y => yearlyMap[y].revenue)
  const yearBookings = yearLabels.map(y => yearlyMap[y].bookings)

  return {
    weekly: {
      labels:   ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      revenue:  weeklyRevenue,
      bookings: weeklyBookings,
    },
    monthly: {
      labels:   ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      revenue:  monthlyRevenue,
      bookings: monthlyBookings,
    },
    yearly: {
      labels:   yearLabels.length   ? yearLabels   : [now.getFullYear().toString()],
      revenue:  yearRevenue.length  ? yearRevenue  : [0],
      bookings: yearBookings.length ? yearBookings : [0],
    },
  }
}

export default function AnalyticsChart({ bookings = [] }) {
  const [range, setRange] = useState('weekly')
  const [type,  setType]  = useState('both')
  const chartRef  = useRef(null)
  const chartInst = useRef(null)

  const DATA = buildData(bookings)
  const d    = DATA[range]

  const totalRevenue = d.revenue.reduce((a, b) => a + b, 0)
  const totalBook    = d.bookings.reduce((a, b) => a + b, 0)

  // ── Feature 3: real counts using paymentStatus ──
  const approved  = bookings.filter(b => b.paymentStatus === 'paid').length
  const pending   = bookings.filter(b => b.paymentStatus !== 'paid').length

  function buildDatasets() {
    const sets = []
    if (type === 'both' || type === 'revenue') {
      sets.push({
        label: 'Revenue (₱)',
        data: d.revenue,
        borderColor: '#0A7C52',
        backgroundColor: 'rgba(10,124,82,0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: '#0A7C52',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
        borderDash: [],
      })
    }
    if (type === 'both' || type === 'bookings') {
      sets.push({
        label: 'Bookings',
        data: d.bookings,
        borderColor: '#534AB7',
        backgroundColor: 'rgba(83,74,183,0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: '#534AB7',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
        yAxisID: type === 'both' ? 'y2' : 'y',
        borderDash: [5, 3],
      })
    }
    return sets
  }

  function buildScales() {
    const scales = {
      x: {
        grid: { color: 'rgba(128,128,128,0.1)' },
        ticks: {
          font: { size: 12 }, color: '#6b9e84',
          autoSkip: false,
          maxRotation: range === 'monthly' ? 45 : 0,
        },
      },
    }
    if (type === 'both') {
      scales.y = {
        type: 'linear', position: 'left',
        grid: { color: 'rgba(128,128,128,0.1)' },
        ticks: {
          font: { size: 11 }, color: '#0A7C52',
          callback: v => '₱' + v.toLocaleString()
        },
      }
      scales.y2 = {
        type: 'linear', position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { font: { size: 11 }, color: '#534AB7', stepSize: 1 },
      }
    } else {
      scales.y = {
        grid: { color: 'rgba(128,128,128,0.1)' },
        ticks: {
          font: { size: 11 },
          color: type === 'revenue' ? '#0A7C52' : '#534AB7',
          callback: v => type === 'revenue' ? '₱' + v.toLocaleString() : v,
        },
      }
    }
    return scales
  }

  useEffect(() => {
    if (chartInst.current) chartInst.current.destroy()
    chartInst.current = new Chart(chartRef.current, {
      type: 'line',
      data: { labels: d.labels, datasets: buildDatasets() },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ctx.dataset.label.includes('Revenue')
                ? ' ₱' + Math.round(ctx.parsed.y).toLocaleString()
                : ' ' + Math.round(ctx.parsed.y) + ' bookings',
            },
          },
        },
        scales: buildScales(),
      },
    })
    return () => { if (chartInst.current) chartInst.current.destroy() }
  }, [range, type, bookings])

  return (
    <div className="ac-wrap">

      <div className="ac-stats">
        <div className="ac-stat">
          <p className="ac-stat-label">Total revenue</p>
          <p className="ac-stat-num purple">₱{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="ac-stat">
          <p className="ac-stat-label">Total bookings</p>
          <p className="ac-stat-num">{totalBook}</p>
        </div>
        <div className="ac-stat">
          <p className="ac-stat-label">Paid</p>
          <p className="ac-stat-num green">{approved}</p>
        </div>
        <div className="ac-stat">
          <p className="ac-stat-label">Unpaid</p>
          <p className="ac-stat-num amber">{pending}</p>
        </div>
      </div>

      <div className="ac-controls">
        <div className="ac-tabs">
          {['weekly', 'monthly', 'yearly'].map(r => (
            <button
              key={r}
              className={`ac-tab${range === r ? ' active' : ''}`}
              onClick={() => setRange(r)}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <div className="ac-type-row">
          {['both', 'revenue', 'bookings'].map(t => (
            <button
              key={t}
              className={`ac-type-btn${type === t ? ' active' : ''}`}
              onClick={() => setType(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="ac-legend">
        <span>
          <span className="ac-legend-dot" style={{ background: '#0A7C52' }}></span>
          Revenue (₱)
        </span>
        <span>
          <span className="ac-legend-dot" style={{ background: '#534AB7' }}></span>
          Bookings
        </span>
      </div>

      <div className="ac-chart-wrap">
        <canvas
          ref={chartRef}
          role="img"
          aria-label="Line chart showing revenue and bookings over time"
        />
      </div>

    </div>
  )
}
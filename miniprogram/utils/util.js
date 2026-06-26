const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatTime(date) {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function getWeekdayText(date) {
  return '周' + WEEKDAYS[date.getDay()]
}

function getChineseDateText(date) {
  const months = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
  return `${months[date.getMonth()]}月${date.getDate()}日`
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekday = firstDay.getDay()
  const totalDays = lastDay.getDate()

  const days = []

  // Previous month padding
  const prevLastDay = new Date(year, month, 0).getDate()
  for (let i = startWeekday - 1; i >= 0; i--) {
    days.push({ day: prevLastDay - i, current: false, date: '' })
  }

  // Current month
  for (let d = 1; d <= totalDays; d++) {
    const m = String(month + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    days.push({ day: d, current: true, date: `${year}-${m}-${dd}` })
  }

  // Next month padding
  const remaining = 7 - (days.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, current: false, date: '' })
    }
  }

  return days
}

function averageMood(fragments) {
  const moods = fragments.filter(f => f.mood).map(f => f.mood)
  if (moods.length === 0) return 0
  return moods.reduce((a, b) => a + b, 0) / moods.length
}

// Mood value -> color for calendar dot
function moodColor(avg) {
  if (avg <= 0) return ''
  if (avg < 1.5) return '#c97a66'
  if (avg < 2.5) return '#cfa06b'
  if (avg < 3.5) return '#c9c19a'
  if (avg < 4.5) return '#9aae8a'
  return '#6E7A66'
}

module.exports = {
  WEEKDAYS,
  formatDate,
  formatTime,
  getWeekdayText,
  getChineseDateText,
  getCalendarDays,
  averageMood,
  moodColor
}

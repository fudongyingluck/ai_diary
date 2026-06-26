const util = require('../../utils/util')
const dbHelper = require('../../utils/db')
const config = require('../../utils/config')

Page({
  data: {
    todayText: '',
    year: 0,
    month: 0,
    monthText: '',
    weekdays: util.WEEKDAYS,
    calendarDays: [],
    moodMap: {},
    today: '',
    recentFragments: [],
    loading: true
  },

  onLoad() {
    const now = new Date()
    this.setData({
      todayText: util.getChineseDateText(now) + ' · ' + util.getWeekdayText(now),
      year: now.getFullYear(),
      month: now.getMonth(),
      today: util.formatDate(now)
    })
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
    this.ensureDefaultTags().then(() => this.loadData())
  },

  async ensureDefaultTags() {
    if (this._tagsInited) return
    try {
      const db = wx.cloud.database()
      const res = await db.collection('tags').limit(1).get()
      if (res.data.length === 0) {
        for (const tag of config.DEFAULT_TAGS) {
          await db.collection('tags').add({
            data: {
              name: tag.name, icon: tag.icon,
              params: tag.params, archived: false,
              createdAt: db.serverDate()
            }
          })
        }
        console.log('Default tags initialized')
      }
      this._tagsInited = true
    } catch (e) {
      console.error('ensureDefaultTags failed:', e)
      this._tagsInited = true
    }
  },

  async loadData() {
    this.setData({ loading: true })
    await Promise.all([this.loadCalendar(), this.loadRecent()])
    this.setData({ loading: false })
  },

  async loadCalendar() {
    const { year, month } = this.data
    const months = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
    const calendarDays = util.getCalendarDays(year, month)

    let moodMap = {}
    try {
      moodMap = await dbHelper.getMonthMoods(year, month)
    } catch (e) {
      console.error('Load moods failed:', e)
    }

    calendarDays.forEach(d => {
      if (d.date && moodMap[d.date]) {
        d.moodColor = util.moodColor(moodMap[d.date])
      }
    })

    this.setData({
      monthText: `${year}年${months[month]}月`,
      calendarDays,
      moodMap
    })
  },

  async loadRecent() {
    try {
      const fragments = await dbHelper.getRecentFragments(10)
      const grouped = []
      let lastDate = ''
      fragments.forEach(f => {
        if (f.date !== lastDate) {
          const d = new Date(f.date.replace(/-/g, '/'))
          grouped.push({
            date: f.date,
            dateText: `${d.getMonth() + 1}月${d.getDate()}日 ${util.getWeekdayText(d)}`,
            moodEmoji: this.getDayMoodEmoji(f.date, fragments),
            fragments: []
          })
          lastDate = f.date
        }
        grouped[grouped.length - 1].fragments.push(f)
      })
      this.setData({ recentFragments: grouped })
    } catch (e) {
      console.error('Load recent failed:', e)
    }
  },

  getDayMoodEmoji(date, allFragments) {
    const dayFrags = allFragments.filter(f => f.date === date && f.mood)
    if (dayFrags.length === 0) return ''
    const avg = dayFrags.reduce((s, f) => s + f.mood, 0) / dayFrags.length
    const idx = Math.round(avg)
    return config.MOOD_EMOJI[idx] || ''
  },

  prevMonth() {
    let { year, month } = this.data
    month--
    if (month < 0) { month = 11; year-- }
    this.setData({ year, month }, () => this.loadCalendar())
  },

  nextMonth() {
    let { year, month } = this.data
    month++
    if (month > 11) { month = 0; year++ }
    this.setData({ year, month }, () => this.loadCalendar())
  },

  tapDay(e) {
    const date = e.currentTarget.dataset.date
    if (!date) return
    wx.navigateTo({ url: `/pages/day/day?date=${date}` })
  },

  tapEntry(e) {
    const date = e.currentTarget.dataset.date
    if (!date) return
    wx.navigateTo({ url: `/pages/day/day?date=${date}` })
  }
})

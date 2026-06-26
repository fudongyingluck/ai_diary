const util = require('../../utils/util')
const dbHelper = require('../../utils/db')
const config = require('../../utils/config')

Page({
  data: {
    date: '',
    dateText: '',
    weekdayText: '',
    fragments: [],
    fragmentCount: 0,
    daySubtitle: '',
    avgMood: 0,
    avgMoodEmoji: '',
    loading: true
  },

  onLoad(options) {
    const date = options.date
    const d = new Date(date.replace(/-/g, '/'))
    this.setData({
      date,
      dateText: `${d.getMonth() + 1}月${d.getDate()}日`,
      weekdayText: util.getWeekdayText(d)
    })
    this.updateSubtitle()
  },

  onShow() {
    this.loadFragments()
  },

  async loadFragments() {
    this.setData({ loading: true })
    try {
      const fragments = await dbHelper.getFragmentsByDate(this.data.date)
      const moods = fragments.filter(f => f.mood).map(f => f.mood)
      let avgMood = 0
      let avgMoodEmoji = ''
      if (moods.length > 0) {
        avgMood = moods.reduce((a, b) => a + b, 0) / moods.length
        avgMoodEmoji = config.MOOD_EMOJI[Math.round(avgMood)] || ''
      }

      fragments.forEach(f => {
        f.timeText = f.time || ''
        f.moodEmoji = f.mood ? config.MOOD_EMOJI[f.mood] : ''
      })

      this.setData({
        fragments,
        fragmentCount: fragments.length,
        avgMood: avgMood.toFixed(1),
        avgMoodEmoji,
        loading: false
      })
      this.updateSubtitle()
    } catch (e) {
      console.error('Load fragments failed:', e)
      this.setData({ loading: false })
    }
  },

  tapFragment(e) {
    const fragId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/record/record?fragId=${fragId}&date=${this.data.date}`
    })
  },

  deleteFrag(e) {
    const fragId = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      success: async (res) => {
        if (res.confirm) {
          try {
            await dbHelper.deleteFragment(fragId)
            wx.showToast({ title: '已删除', icon: 'success' })
            this.loadFragments()
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  addRecord() {
    wx.navigateTo({
      url: `/pages/record/record?date=${this.data.date}`
    })
  },

  updateSubtitle() {
    const { weekdayText, fragmentCount, avgMoodEmoji, avgMood } = this.data
    let sub = `${weekdayText} · 共 ${fragmentCount} 笔`
    if (avgMoodEmoji) sub += ` · 均值${avgMoodEmoji}${avgMood}`
    this.setData({ daySubtitle: sub })
  }
})

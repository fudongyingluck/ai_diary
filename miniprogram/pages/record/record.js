const util = require('../../utils/util')
const dbHelper = require('../../utils/db')
const config = require('../../utils/config')

Page({
  data: {
    date: '',
    dateText: '',
    time: '',
    hasTime: false,
    mood: 0,
    content: '',
    contentLen: 0,
    maxLen: config.MAX_CONTENT_LENGTH,
    tags: [],
    selectedTags: [],
    selectedTagMap: {},
    editMode: false,
    fragId: '',
    moodEmojis: config.MOOD_EMOJI.slice(1),
    moodLabels: config.MOOD_LABEL.slice(1)
  },

  onLoad(options) {
    const now = new Date()
    let date = options.date || util.formatDate(now)
    let editMode = false
    let fragId = ''

    if (options.fragId) {
      editMode = true
      fragId = options.fragId
    }

    const d = new Date(date.replace(/-/g, '/'))
    this.setData({
      date,
      dateText: `${d.getMonth() + 1}月${d.getDate()}日 ${util.getWeekdayText(d)}`,
      editMode,
      fragId
    })

    if (editMode) this.loadFragment(fragId)
  },

  onShow() {
    this.loadTags()
  },

  async loadTags() {
    try {
      const tags = await dbHelper.getTags(false)
      this.setData({ tags })
    } catch (e) {
      console.error('Load tags failed:', e)
    }
  },

  async loadFragment(fragId) {
    try {
      const res = await dbHelper.db().collection('fragments').doc(fragId).get()
      const f = res.data
      const selectedTags = f.tags || []
      const selectedTagMap = {}
      selectedTags.forEach(t => { selectedTagMap[t.tagId] = true })
      this.setData({
        date: f.date,
        time: f.time || '',
        hasTime: !!f.time,
        mood: f.mood || 0,
        content: f.content || '',
        contentLen: (f.content || '').length,
        selectedTags,
        selectedTagMap
      })
      const d = new Date(f.date.replace(/-/g, '/'))
      this.setData({
        dateText: `${d.getMonth() + 1}月${d.getDate()}日 ${util.getWeekdayText(d)}`
      })
    } catch (e) {
      console.error('Load fragment failed:', e)
    }
  },

  onDateChange(e) {
    const date = e.detail.value
    const d = new Date(date.replace(/-/g, '/'))
    this.setData({
      date,
      dateText: `${d.getMonth() + 1}月${d.getDate()}日 ${util.getWeekdayText(d)}`
    })
  },

  onTimeChange(e) {
    this.setData({ time: e.detail.value, hasTime: true })
  },

  clearTime() {
    this.setData({ time: '', hasTime: false })
  },

  selectMood(e) {
    const mood = parseInt(e.currentTarget.dataset.mood)
    this.setData({ mood: this.data.mood === mood ? 0 : mood })
  },

  onContentInput(e) {
    const content = e.detail.value
    this.setData({ content, contentLen: content.length })
  },

  toggleTag(e) {
    const tagId = e.currentTarget.dataset.id
    const { selectedTags, tags } = this.data
    const idx = selectedTags.findIndex(t => t.tagId === tagId)

    if (idx >= 0) {
      selectedTags.splice(idx, 1)
      this.updateTagMap(selectedTags)
    } else {
      if (selectedTags.length >= config.MAX_TAGS_PER_FRAGMENT) {
        wx.showToast({ title: `最多选${config.MAX_TAGS_PER_FRAGMENT}个标签`, icon: 'none' })
        return
      }
      const tag = tags.find(t => t._id === tagId)
      if (!tag) return
      selectedTags.push({
        tagId: tag._id,
        name: tag.name,
        icon: tag.icon,
        values: {}
      })
      this.updateTagMap(selectedTags)
    }
  },

  updateTagMap(selectedTags) {
    const selectedTagMap = {}
    selectedTags.forEach(t => { selectedTagMap[t.tagId] = true })
    this.setData({ selectedTags, selectedTagMap })
  },

  onParamInput(e) {
    const { tagid, key } = e.currentTarget.dataset
    const value = e.detail.value
    const { selectedTags } = this.data
    const tag = selectedTags.find(t => t.tagId === tagid)
    if (tag) {
      tag.values[key] = value
      this.setData({ selectedTags })
    }
  },

  onParamNumberInput(e) {
    const { tagid, key } = e.currentTarget.dataset
    const value = parseFloat(e.detail.value) || 0
    const { selectedTags } = this.data
    const tag = selectedTags.find(t => t.tagId === tagid)
    if (tag) {
      tag.values[key] = value
      this.setData({ selectedTags })
    }
  },

  selectOption(e) {
    const { tagid, key, option } = e.currentTarget.dataset
    const { selectedTags } = this.data
    const tag = selectedTags.find(t => t.tagId === tagid)
    if (tag) {
      tag.values[key] = option
      this.setData({ selectedTags })
    }
  },

  async save() {
    const { date, time, hasTime, mood, content, selectedTags, editMode, fragId } = this.data

    if (!content && !mood && selectedTags.length === 0) {
      wx.showToast({ title: '请至少记录一项内容', icon: 'none' })
      return
    }

    for (const st of selectedTags) {
      const tagDef = this.data.tags.find(t => t._id === st.tagId)
      if (tagDef) {
        for (const p of tagDef.params) {
          if (p.required && !st.values[p.key]) {
            wx.showToast({ title: `请填写「${tagDef.name}」的${p.label}`, icon: 'none' })
            return
          }
        }
      }
    }

    wx.showLoading({ title: '保存中...' })
    try {
      for (const st of selectedTags) {
        const tagDef = this.data.tags.find(t => t._id === st.tagId)
        if (!tagDef) continue
        for (let i = 0; i < tagDef.params.length; i++) {
          const p = tagDef.params[i]
          if (p.type === 'text' && st.values[p.key]) {
            const val = st.values[p.key]
            if (!p.options.includes(val)) {
              await dbHelper.updateTagOptions(st.tagId, i, val)
            }
          }
        }
      }

      if (editMode) {
        await dbHelper.updateFragment(fragId, {
          date, time: hasTime ? time : null, mood, content, tags: selectedTags
        })
      } else {
        await dbHelper.addFragment({
          date, time: hasTime ? time : null, mood, content, tags: selectedTags
        })
      }

      wx.hideLoading()
      wx.showToast({ title: '已保存', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 800)
    } catch (e) {
      wx.hideLoading()
      console.error('Save failed:', e)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  goCreateTag() {
    wx.navigateTo({ url: '/pages/tag-create/tag-create' })
  }
})

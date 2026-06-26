const dbHelper = require('../../utils/db')
const config = require('../../utils/config')

Page({
  data: {
    name: '',
    icon: '',
    presetIcons: ['💪', '🏃', '📖', '🎮', '🍽️', '💊', '😴', '🧘', '☕', '🎵', '✈️', '💰', '⚡', '❤️', '🔥'],
    params: [],
    showAddParam: false,
    newParamLabel: '',
    newParamType: 'text',
    newParamUnit: '',
    newParamRequired: false
  },

  onInputName(e) {
    this.setData({ name: e.detail.value })
  },

  onInputIcon(e) {
    this.setData({ icon: e.detail.value })
  },

  pickIcon(e) {
    const icon = e.currentTarget.dataset.icon
    this.setData({ icon: this.data.icon === icon ? '' : icon })
  },

  toggleAddParam() {
    this.setData({
      showAddParam: !this.data.showAddParam,
      newParamLabel: '',
      newParamType: 'text',
      newParamUnit: '',
      newParamRequired: false
    })
  },

  onParamLabel(e) {
    this.setData({ newParamLabel: e.detail.value })
  },

  onParamType(e) {
    this.setData({ newParamType: e.detail.value === '0' ? 'text' : 'number' })
  },

  onParamUnit(e) {
    this.setData({ newParamUnit: e.detail.value })
  },

  toggleRequired() {
    this.setData({ newParamRequired: !this.data.newParamRequired })
  },

  addParam() {
    const { newParamLabel, newParamType, newParamUnit, newParamRequired, params } = this.data
    if (!newParamLabel.trim()) {
      wx.showToast({ title: '请填写参数名称', icon: 'none' })
      return
    }

    const key = newParamLabel.trim().toLowerCase().replace(/\s+/g, '_')
    params.push({
      key,
      label: newParamLabel.trim(),
      type: newParamType,
      unit: newParamType === 'number' ? (newParamUnit || null) : null,
      required: newParamRequired,
      options: []
    })

    this.setData({
      params,
      showAddParam: false,
      newParamLabel: '',
      newParamType: 'text',
      newParamUnit: '',
      newParamRequired: false
    })
  },

  removeParam(e) {
    const idx = e.currentTarget.dataset.index
    const params = this.data.params
    params.splice(idx, 1)
    this.setData({ params })
  },

  async save() {
    const { name, icon, params } = this.data

    if (!name.trim()) {
      wx.showToast({ title: '请填写标签名称', icon: 'none' })
      return
    }
    try {
      const existing = await dbHelper.getTags(false)
      if (existing.length >= config.MAX_TAGS_PER_USER) {
        wx.showToast({ title: `最多创建${config.MAX_TAGS_PER_USER}个标签`, icon: 'none' })
        return
      }
    } catch (e) {
      // continue
    }

    wx.showLoading({ title: '创建中...' })
    try {
      await dbHelper.addTag({ name: name.trim(), icon: (icon || '').trim() || '📌', params })
      wx.hideLoading()
      wx.showToast({ title: '创建成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 800)
    } catch (e) {
      wx.hideLoading()
      console.error('Create tag failed:', e)
      wx.showToast({ title: '创建失败', icon: 'none' })
    }
  },

})

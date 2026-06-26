const dbHelper = require('../../utils/db')

Page({
  data: {
    tags: []
  },

  onShow() {
    this.loadTags()
  },

  async loadTags() {
    try {
      const tags = await dbHelper.getTags(true)
      this.setData({ tags })
    } catch (e) {
      console.error('Load tags failed:', e)
    }
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/tag-create/tag-create' })
  },

  async deleteTag(e) {
    const tagId = e.currentTarget.dataset.id
    const tagName = e.currentTarget.dataset.name

    try {
      const used = await dbHelper.isTagUsed(tagId)
      if (used) {
        wx.showToast({ title: `「${tagName}」已被使用，暂不能删除`, icon: 'none', duration: 2000 })
        return
      }

      wx.showModal({
        title: '删除标签',
        content: `确定删除「${tagName}」？`,
        success: async (res) => {
          if (res.confirm) {
            await dbHelper.deleteTag(tagId)
            wx.showToast({ title: '已删除', icon: 'success' })
            this.loadTags()
          }
        }
      })
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

})

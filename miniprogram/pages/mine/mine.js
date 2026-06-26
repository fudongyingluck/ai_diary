const dbHelper = require('../../utils/db')
const util = require('../../utils/util')

Page({
  data: {
    tagCount: 0,
    fragCount: 0
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
    this.loadStats()
  },

  async loadStats() {
    try {
      const tags = await dbHelper.getTags(true)
      const frags = await dbHelper.db().collection('fragments').count()
      this.setData({
        tagCount: tags.length,
        fragCount: frags.total
      })
    } catch (e) {
      console.error('Load stats failed:', e)
    }
  },

  goTagManage() {
    wx.navigateTo({ url: '/pages/tag-manage/tag-manage' })
  },

  async exportJSON() {
    wx.showLoading({ title: '准备中...' })
    try {
      const fragments = await dbHelper.getAllFragments()
      const tags = await dbHelper.getTags(true)
      const data = JSON.stringify({ tags, fragments }, null, 2)

      const fs = wx.getFileSystemManager()
      const filePath = `${wx.env.USER_DATA_PATH}/diary_backup.json`
      fs.writeFileSync(filePath, data, 'utf8')
      wx.hideLoading()

      this._exportFile = filePath
      this._exportName = `diary_backup_${util.formatDate(new Date())}.json`
      wx.showModal({
        title: '文件已生成',
        content: `共 ${fragments.length} 条记录，点击确定发送文件`,
        success: (res) => {
          if (res.confirm) this.shareFile()
        }
      })
    } catch (e) {
      wx.hideLoading()
      console.error('Export failed:', e)
      wx.showToast({ title: '导出失败', icon: 'none' })
    }
  },

  async exportCSV() {
    wx.showLoading({ title: '准备中...' })
    try {
      const fragments = await dbHelper.getAllFragments()
      let csv = 'date,time,mood,content,tags\n'
      fragments.forEach(f => {
        const tagStr = (f.tags || []).map(t => {
          let s = t.name
          if (t.values) {
            Object.keys(t.values).forEach(k => { s += `:${t.values[k]}` })
          }
          return s
        }).join(';')
        const content = (f.content || '').replace(/"/g, '""')
        csv += `${f.date},${f.time || ''},${f.mood || ''},"${content}","${tagStr}"\n`
      })

      const fs = wx.getFileSystemManager()
      const filePath = `${wx.env.USER_DATA_PATH}/diary_export.csv`
      fs.writeFileSync(filePath, csv, 'utf8')
      wx.hideLoading()

      this._exportFile = filePath
      this._exportName = `diary_export_${util.formatDate(new Date())}.csv`
      wx.showModal({
        title: '文件已生成',
        content: `共 ${fragments.length} 条记录，点击确定发送文件`,
        success: (res) => {
          if (res.confirm) this.shareFile()
        }
      })
    } catch (e) {
      wx.hideLoading()
      console.error('Export CSV failed:', e)
      wx.showToast({ title: '导出失败', icon: 'none' })
    }
  },

  shareFile() {
    const filePath = this._exportFile
    const fileName = this._exportName
    if (wx.saveFileToDisk) {
      wx.saveFileToDisk({
        filePath,
        success: () => wx.showToast({ title: '已保存', icon: 'success' }),
        fail: () => this.shareViaMessage(filePath, fileName)
      })
    } else {
      this.shareViaMessage(filePath, fileName)
    }
  },

  shareViaMessage(filePath, fileName) {
    wx.shareFileMessage({
      filePath,
      fileName,
      fail: (e) => {
        if (e.errMsg && e.errMsg.includes('cancel')) return
        wx.showToast({ title: '请在真机上使用导出功能', icon: 'none', duration: 2000 })
      }
    })
  }
})

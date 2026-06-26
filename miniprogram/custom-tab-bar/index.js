Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/timeline/timeline', text: '时光', idx: 0 },
      { pagePath: '/pages/mine/mine', text: '我的', idx: 1 }
    ]
  },

  methods: {
    switchTab(e) {
      const idx = e.currentTarget.dataset.index
      const url = this.data.list[idx].pagePath
      wx.switchTab({ url })
    },

    goRecord() {
      wx.navigateTo({ url: '/pages/record/record' })
    }
  }
})

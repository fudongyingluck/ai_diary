Component({
  properties: {
    title: { type: String, value: '' },
    subtitle: { type: String, value: '' },
    showBack: { type: Boolean, value: true },
    showHome: { type: Boolean, value: false },
    showLogo: { type: Boolean, value: true }
  },

  data: {
    statusBarHeight: 44,
    navBarHeight: 44,
    capsuleLeft: 0,
    capsuleHeight: 32,
    capsuleTop: 0,
    capsuleWidth: 87,
    btnWidth: 0
  },

  lifetimes: {
    attached() {
      const app = getApp()
      const menuBtn = app.globalData.menuButtonInfo
      const capsuleWidth = menuBtn ? menuBtn.width : 87
      this.setData({
        statusBarHeight: app.globalData.statusBarHeight,
        navBarHeight: app.globalData.navBarHeight,
        capsuleLeft: menuBtn ? menuBtn.left : 320,
        capsuleHeight: menuBtn ? menuBtn.height : 32,
        capsuleTop: menuBtn ? menuBtn.top : 48,
        capsuleWidth,
        btnWidth: Math.floor(capsuleWidth / 2)
      })
    }
  },

  methods: {
    onBack() {
      wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/timeline/timeline' }) })
    },
    onHome() {
      wx.switchTab({ url: '/pages/timeline/timeline' })
    }
  }
})

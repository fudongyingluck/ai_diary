App({
  globalData: {
    statusBarHeight: 44,
    navBarHeight: 44,
    menuButtonInfo: null
  },

  onLaunch() {
    const info = wx.getSystemInfoSync()
    const menuBtn = wx.getMenuButtonBoundingClientRect()
    const statusBarHeight = info.statusBarHeight || 44
    const navBarHeight = (menuBtn.top - statusBarHeight) * 2 + menuBtn.height

    this.globalData.statusBarHeight = statusBarHeight
    this.globalData.navBarHeight = navBarHeight
    this.globalData.menuButtonInfo = menuBtn

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }

    wx.cloud.init({
      env: 'cloudbase-d6glb6vib9fd20eb5'
    })
  }
})

import client from 'common/utils/client'
//app.js
App({
	onLaunch: function () {
		//小程序初始化完成给公共工具传入APP实例
		client.init(this);

		if (wx.getUpdateManager) {
			const updateManager = wx.getUpdateManager()
			updateManager.onCheckForUpdate(function (res) {
				// 请求完新版本信息的回调
				//console.log(res.hasUpdate)
			})
			updateManager.onUpdateReady(function () {
				wx.showModal({
					title: '更新提示',
					content: '新版本已经准备好，是否重启应用？',
					success: function (res) {
						if (res.confirm) {
							// 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
							updateManager.applyUpdate()
						}
					}
				})
			})
			updateManager.onUpdateFailed(function () {
				// 新的版本下载失败
			})
		}
	},
	globalData: {
		appId: 'wxbe1441b1d8cdf0df',
		// targetAppId: 'wx546860b227876058', //公众号appId
		targetAppId: 'wx354808a4b977563b', //公众号appId
		userInfo: null,
		tokenInfo: null,
	}
})
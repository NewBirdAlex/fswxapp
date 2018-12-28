import { apiUrl } from '../../common/config.js'
import { $wuxToast } from '../../components/wux'
import utils from '../../common/utils/utils.js'
import client from '../../common/utils/client';
const app = getApp()
Page({
	data: {
		dataList: [],
	},
	onLoad: function (options) {
		
	},
	onShow: function () {
		this.getRealNameData()
	},
	getRealNameData() {
		wx.showLoading({
			title: '正在加载中...',
		})
		client.postData(apiUrl + "eb-api/mrn/list", {}).then(res => {
			wx.hideLoading()
			if (res.data.code === 200) {
				this.data.dataList = [];
				res.data.data.forEach(item=>{
					if (item.mrnDefault==1){
						item.active = true;
					}else{
						item.active = false;
					}
					item.mrnIdentity = item.mrnIdentity.replace(/(\d{3})\d{11}(\d{4})/, '$1***********$2');
				})
				this.setData({
					dataList: this.data.dataList.concat(res.data.data)
				})
			} else {
				$wuxToast.show({
					type: 'text',
					timer: 2000,
					color: '#fff',
					text: res.data.msg
				})
			}
		}, res => {
			wx.hideLoading()
			console.log(res)
		})
	},
	addRealName() {
		wx.navigateTo({
			url: '/pages/realName/addRealName/index',
		})
	},
	setDefault(e) {
		let index = e.currentTarget.dataset.index;
		if (this.data.dataList[index].active) return;
		client.postData(apiUrl + "eb-api/mrn/defaultMemberRealName", { "mrnId": e.currentTarget.dataset.mrnid }).then(res => {
			wx.hideLoading()
			if (res.data.code === 200) {
				this.data.dataList.forEach(item => {
					item.active = false;
				})
				this.data.dataList[index].active = true;
				this.setData({
					dataList: this.data.dataList
				})
			} else {
				$wuxToast.show({
					type: 'text',
					timer: 2000,
					color: '#fff',
					text: res.data.msg
				})
			}
		}, res => {
			wx.hideLoading()
			console.log(res)
		})
	},
	deleteIdentity(e) {
		let _this = this;
		wx.showModal({
			title: '提示',
			content: '确定删除？',
			success: function (res) {
				if (res.confirm) {
					client.postData(apiUrl + "eb-api/mrn/removeMemberRealName", { "mrnId": e.currentTarget.dataset.mrnid }).then(res => {
						wx.hideLoading()
						if (res.data.code === 200) {
							_this.data.dataList.splice(e.currentTarget.dataset.index, 1);
							_this.setData({
								dataList: _this.data.dataList
							})
						} else {
							$wuxToast.show({
								type: 'text',
								timer: 2000,
								color: '#fff',
								text: res.data.msg
							})
						}
					}, res => {
						wx.hideLoading()
						console.log(res)
					})
				}
			}
		})
	},
	previewImage(e) {
		let index = e.currentTarget.dataset.index;
		wx.previewImage({
			current: e.currentTarget.dataset.src,
			urls: [this.data.dataList[index].mrnFrontIcon, this.data.dataList[index].mrnBackIcon]
		});
	},
})
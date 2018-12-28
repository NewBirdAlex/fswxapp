import { apiUrl } from '../../../common/config.js'
import { $wuxToast } from '../../../components/wux'
import utils from '../../../common/utils/utils.js'
import client from '../../../common/utils/client';
import tracker from '../../../common/utils/tracker.js';
const app = getApp()
Page({
	data: {
		name: '',
		identity: '',
		progress_pos: '已上传',
		image_pos: '',
		pos_bool: false,
		progress_opp: '已上传',
		opp_bool: false,
		image_opp: '',
	},
	onLoad: function (options) {

	},
	bindName(e) {
		this.setData({
			name: e.detail.value
		})
	},
	bindIdentity(e) {
		this.setData({
			identity: e.detail.value
		})
	},
	addRealName(e) {
		if (this.data.name == "" || this.data.identity == "") {
			wx.showModal({
				title: '提示',
				content: '请输入完整的身份信息',
			})
		} else {
			wx.showLoading({
				title: '正在添加',
			})
			client.postData(apiUrl + "eb-api/mrn/createMemberRealName", {
				"mrnBackIcon": this.data.image_opp,
				"mrnFrontIcon": this.data.image_pos,
				"mrnIdentity": this.data.identity,
				"mrnName": this.data.name
			}).then(res => {
				wx.hideLoading()
				if (res.data.code === 200) {
					$wuxToast.show({
						type: 'text',
						timer: 2000,
						color: '#fff',
						text: "添加成功"
					})
					setTimeout(function () {
						wx.navigateBack({
							delta: 1
						})
					}, 2000)
				} else {
					console.log(res)
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
	},
	onAddPic(e) {
		wx.chooseImage({
			count: 1, // 默认9
			sizeType: ['compressed'],
			success: res => {
				var tempFilePaths = res.tempFilePaths[0]
				this.uploadImage(tempFilePaths, e.currentTarget.dataset.index)
			}
		})
	},

	uploadImage(filePath, index) {
		let _this = this;
		let fileName = filePath.substr(filePath.lastIndexOf('/') + 1);
		const uploadTask = wx.uploadFile({
			url: 'https://video.fshtop.com/common/1.0.0/upload/file',
			filePath: filePath,
			name: 'multiFile',
			formData: {
				"creator": wx.getStorageSync("tokenInfo").memberId,
				"fileName": fileName,
				"mediumType": 1,
				"storeType": 3
			},
			success: res => {
				var data = JSON.parse(res.data);
				if(index==1){
					_this.setData({
						image_pos: data.data.ossUrl
					})
				}else{
					_this.setData({
						image_opp: data.data.ossUrl
					})
				}
			},
			fail: res => {
				console.log(res)
			}
		})

		uploadTask.onProgressUpdate((res) => {
			if (index == 1) {
				if (res.progress == 100) {
					_this.setData({
						progress_pos: '已上传',
						pos_bool: false
					})
				} else {
					_this.setData({
						progress_pos: res.progress,
						pos_bool: true
					})
				}
			} else {
				if (res.progress == 100) {
					_this.setData({
						progress_opp: '已上传',
						opp_bool: false
					})
				} else {
					_this.setData({
						progress_opp: res.progress,
						opp_bool: true
					})
				}
			}
			// console.log('上传进度', res.progress)
			// console.log('已经上传的数据长度', res.totalBytesSent)
			// console.log('预期需要上传的数据总长度', res.totalBytesExpectedToSend)
		})
	},
})
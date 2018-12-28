import { apiUrl } from '../../../common/config.js'
import { $wuxToast } from '../../../components/wux'
import utils from '../../../common/utils/utils.js'
import client from '../../../common/utils/client'
import tracker from '../../../common/utils/tracker.js';
const app = getApp()
Page({
	data: {
		default: 0,
		descriptiveStar: 5,
		logisticsStar: 5,
		serviceStar: 5,
		hideAdd: true,
		goodAll: [],
		comment: "",
		pinkStar: 5,
		imageIndex: ""

	},
	onLoad: function (options) {
		this.getOrderList(options.ordOrderId);
	},
	onShow: function(){
		tracker.firstRead({ id: '715', title: '商品发表评价页' });
	},
	getOrderList: function (ordOrderId) {
		var _this = this;
		wx.showLoading({
			title: '加载中',
		})
		client.postData(apiUrl + "eb-api/order/getByOrderSubId?ordOrderId=" + ordOrderId, {}).then(res => {
			wx.hideLoading();
			if (res.data.code === 200) {
				_this.setData({
					goodAll: res.data.data.orderDetailList,
				})
				for (var i = 0; i < _this.data.goodAll.length; i++) {
					_this.data.goodAll[i].image = [];
					_this.data.goodAll[i].hideAdd = true;
					_this.data.goodAll[i].comment = "";
					_this.data.goodAll[i].starNum = 5;
					_this.data.goodAll[i].active = 0;
				}
				_this.setData({
					goodAll: _this.data.goodAll
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
			wx.hideLoading();
			console.log(res);
		})
	},
	comment: function (e) {
		tracker.trackData({ id: '715009', title: '发表评价' });
		var _this = this;
		let comList = [];
		if (this.data.tel == '') {
			wx.showModal({
				title: '提示',
				content: '请输入正确联系方式',
			})
			return;
		}
		wx.showLoading({
			title: '加载中',
		})
		this.data.goodAll.forEach((val, index) => {
			comList.push({
				"oicComment": val.comment,
				"oicImg": val.image.toString(),
				"oicImgStatus": val.image.length == 0 ? 0 : 1,
				"oicLevel": "",
				"oicMemberId": "",
				"oicMemberNickname": "",
				"oicOimId": val.ordId,
				"oicShopId": 0,
				"oicSkuId": val.detailSku.skuId,
				"oicStarNum": val.starNum,
				"oicStatus": "",
				"orsMemberImg": "",
				"oicIsAnonymous": val.active ? 1 : 0,
			});
		});
		client.postData(apiUrl + "eb-api/oic/createOrderItemComment", comList).then(res => {
			wx.hideLoading();
			if (res.data.code === 200) {
				wx.showModal({
					title: '提示',
					content: '评论成功',
					showCancel: false,
					success: function (res) {
						if (res.confirm) {
							wx.redirectTo({
								url: '/pages/order/successEvaluation/index'
							})
						}
					}
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
			wx.hideLoading();
			console.log(res);
		})
	},
	chooseDefault: function (e) {
		tracker.trackData({ id: '715005', title: '点击匿名' });
		this.data.goodAll.forEach((item, index) => {
			if (e.currentTarget.dataset.index == index) {
				item.active = !item.active
			}
		})
		this.setData({
			goodAll: this.data.goodAll
		})
	},
	storeScoreOne: function (e) {
		tracker.trackData({ id: '715006', title: '点击店铺评分-描述' });
		this.setData({
			descriptiveStar: parseInt(e.target.id)
		})
	},
	storeScoretwo: function (e) {
		tracker.trackData({ id: '715007', title: '点击店铺评分-物流' });
		this.setData({
			logisticsStar: parseInt(e.target.id)
		})
	},
	storeScorethree: function (e) {
		tracker.trackData({ id: '715008', title: '点击店铺评分-服务' });
		this.setData({
			serviceStar: parseInt(e.target.id)
		})
	},
	storeStarGrey: function (e) {
		tracker.trackData({ id: '715002', title: '点击商品评价分数' });
		this.data.goodAll[e.currentTarget.dataset.index].starNum = parseInt(e.target.id) + this.data.goodAll[e.currentTarget.dataset.index].starNum + 1;
		this.setData({
			goodAll: this.data.goodAll
		})
	},
	storeGoodStar: function (e) {
		tracker.trackData({ id: '715002', title: '点击商品评价分数' });
		this.data.goodAll[e.currentTarget.dataset.index].starNum = parseInt(e.target.id);
		this.setData({
			goodAll: this.data.goodAll
		})
	},
	trackerText() {
		tracker.trackData({ id: '715003', title: '点击输入评价' });
	},
	deleteImage: function (e) {
		this.data.goodAll[e.currentTarget.dataset.index].image.splice(e.currentTarget.id, 1);
		if (this.data.goodAll[e.currentTarget.dataset.index].image.length < 4) {
			this.data.goodAll[e.currentTarget.dataset.index].hideAdd = true;
		}
		this.setData({
			goodAll: this.data.goodAll

		})
	},
	onAddPic(e) {
		var _this = this;
		tracker.trackData({ id: '715004', title: '添加图片' });
		wx.chooseImage({
			count: 1, // 默认9
			sizeType: ['compressed'],
			success: res => {
				var tempFilePaths = res.tempFilePaths[0]
				_this.uploadImage(tempFilePaths)
				_this.setData({
					goodAll: _this.data.goodAll,
					imageIndex: parseInt(e.currentTarget.dataset.index)
				})
			}
		})
	},
	uploadImage(filePath) {
		var _this = this;
		let fileName = filePath.substr(filePath.lastIndexOf('/') + 1);
		wx.showLoading({
			title: '加载中',
		})
		const uploadTask = wx.uploadFile({
			url: 'https://video.fshtop.com/common/1.0.0/upload/file',
			filePath: filePath,
			name: 'multiFile',
			formData: {
				"creator": '',
				"fileName": fileName,
				"mediumType": 1,
				"storeType": 3
			},
			success: res => {
				wx.hideLoading()
				if (res.data.code == 200) {
					var data = JSON.parse(res.data);
					_this.data.goodAll[_this.data.imageIndex].image.push(data.data.localUrl)
					if (_this.data.goodAll[_this.data.imageIndex].image.length >= 4) {
						_this.data.goodAll[_this.data.imageIndex].hideAdd = false;
					}
					_this.setData({
						goodAll: _this.data.goodAll,
					})
				} else {
					$wuxToast.show({
						type: 'text',
						timer: 2000,
						color: '#fff',
						text: res.data.msg
					})
				}
			},
			fail: res => {
				console.log(res)
			}
		})
		uploadTask.onProgressUpdate((res) => {
			console.log('上传进度', res.progress)
			console.log('已经上传的数据长度', res.totalBytesSent)
			console.log('预期需要上传的数据总长度', res.totalBytesExpectedToSend)
		})
	},
	bindCommnet: function (e) {
		this.data.goodAll[e.currentTarget.dataset.index].comment = e.detail.value;
		this.setData({
			goodAll: this.data.goodAll
		})
	},
	onReachBottom: function () {

	},
	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage: function () {

	}
})
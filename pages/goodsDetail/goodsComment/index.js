import { apiUrl } from '../../../common/config.js'
import { $wuxToast } from '../../../components/wux'
import utils from '../../../common/utils/utils.js'
import client from '../../../common/utils/client'
import tracker from '../../../common/utils/tracker.js';
Page({
	data: {
		spuId: null,
		commentData: [],
		commentPageData: null,
		commentDataImg: [],
		commentPageImgData: null,
		activeIndex: 0,
		page: 1,
		pageImg: 1,
		noMoreData: false,
		noMoreImgData: false,
		isLoading: false,
	},
	onLoad: function (options) {
		console.log(options)
		this.setData({
			spuId: options.spuId
		})
		this.getGoodsComment(options.spuId)
		this.getGoodsCommentWithPic(options.spuId)
	},
	onShow: function () {
		tracker.firstRead({ id: '702', title: '商品评价页' });
	},
	getGoodsComment(spuId) {
		wx.showLoading({
			title: '加载数据...',
			mask: true
		})
		client.postData(apiUrl + "eb-api/oic/getOrderItemCommentBySpuid", {
			"oicImgStatus": 0,
			"page": {
				"currentPage": this.data.page,
				"pageSize": 10,
			},
			"skuId": "",
			"spuId": spuId
		}).then(res => {
			wx.hideLoading()
			if (res.data.code === 200) {
				res.data.data.forEach((item, ind) => {
					item.oicCreatedTime = utils.formatTime(item.oicCreatedTime)
					if (item.oicImg != '' && item.oicImg != null) {
						item.oicImg = item.oicImg.split(",");
					} else {
						item.oicImg = [];
					}
					if (item.oicIsAnonymous==1){
						if (item.oicMemberNickname.length==2){
							item.oicMemberNickname = item.oicMemberNickname.substring(0, 1) + "*"
						} else if (item.oicMemberNickname.length > 2){
							item.oicMemberNickname = item.oicMemberNickname.substring(0, 1) + "****" + item.oicMemberNickname.substring(item.oicMemberNickname.length - 1, item.oicMemberNickname.length)
						}
					}
				});
				this.setData({
					commentData: this.data.commentData.concat(res.data.data),
					commentPageData: res.data.page,
					page: this.data.page+1,
					isLoading: false
				})
				if (res.data.data.length<10){
					this.setData({
						noMoreData: true
					})
				}
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
	getGoodsCommentWithPic(spuId) {
		wx.showLoading({
			title: '加载数据...',
			mask: true
		})
		client.postData(apiUrl + "eb-api/oic/getOrderItemCommentBySpuid", {
			"oicImgStatus": 1,
			"page": {
				"currentPage": this.data.pageImg,
				"pageSize": 10,
			},
			"skuId": "",
			"spuId": spuId
		}).then(res => {
			wx.hideLoading()
			if (res.data.code === 200) {
				res.data.data.forEach((item, ind) => {
					item.oicCreatedTime = utils.formatTime(item.oicCreatedTime)
					if (item.oicImg != '' && item.oicImg != null) {
						item.oicImg = item.oicImg.split(",");
					} else {
						item.oicImg = [];
					}
				});
				this.setData({
					commentDataImg: this.data.commentDataImg.concat(res.data.data),
					commentPageImgData: res.data.page,
					pageImg: this.data.pageImg+1,
					isLoading: false
				})
				if (res.data.data.length < 10) {
					this.setData({
						noMoreImgData: true
					})
				}
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
	itemClick(e) {
		if (e.currentTarget.dataset.index==0){
			tracker.trackData({ id: '702002', title: '点击全部' });
		}else{
			tracker.trackData({ id: '702003', title: '点击有图' });
		}
		this.setData({
			activeIndex: e.currentTarget.dataset.index
		})
	},
	previewImage(e) {
		tracker.trackData({ id: '702004', title: '查看评价图片' });
		let _this = this
		if (this.data.activeIndex==1){
			wx.previewImage({
				current: e.currentTarget.dataset.img,
				urls: _this.data.commentDataImg[e.currentTarget.dataset.index].oicImg,
			})
		}else{
			wx.previewImage({
				current: e.currentTarget.dataset.img,
				urls: _this.data.commentData[e.currentTarget.dataset.index].oicImg,
			})
		}
	},
	// onPageScroll() {
	// 	tracker.trackData({ id: '702005', title: '往下滑动' })
	// },
	onReachBottom: function (e) {
		if (this.data.activeIndex == 1) {
			if(!this.data.noMoreImgData){
				this.setData({
					isLoading: true
				})
				this.getGoodsCommentWithPic(this.data.spuId)
			}
		} else {
			if (!this.data.noMoreData) {
				this.setData({
					isLoading: true
				})
				this.getGoodsComment(this.data.spuId)
			}
		}
	},

})
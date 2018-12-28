import { apiUrl,apiUrl_cms } from '../../../common/config.js'
import { $wuxToast } from '../../../components/wux'
import utils from '../../../common/utils/utils.js'
import client from '../../../common/utils/client';
import tracker from '../../../common/utils/tracker.js';
Page({
	data: {
		ordOrderId: null,
		recommendData: [],
		isLoading: false,
		noMoreData: false,
		noData: false,
		page: 1,
	},
	onLoad: function (options) {
		this.setData({
			ordOrderId: options.ordOrderId
		})
		this.getRecommendData()
	},
	goEvaluation: function (e) {
		if (e.target.id == 1) {
			wx.navigateTo({
				url: '/pages/order/goodsEvaluation/index?ordOrderId=' + this.data.ordOrderId
			})
		} else {
			wx.navigateTo({
				url: '/pages/order/orderDetail/index?type=1&orderId=' + this.data.ordOrderId
			})
		}

	},
	getRecommendData() {
		client.postData(apiUrl_cms + 'cms-api/goods/2.0.0/getContentListFence', {
			"currentPage": this.data.page,
			"pageSize": 10,
			"fenceId": 10001,
		}).then(res => {
			if (res.data.code === 200) {
				if (res.data.data.length < 10	) {
					this.setData({
						noMoreData: true
					})
				}
				this.setData({
					recommendData: this.data.recommendData.concat(res.data.data),
					page: this.data.page + 1,
					isLoading: true
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
			console.log(res);
		})
	},
	onReachBottom() {
		if (this.data.noMoreData) {
			return
		}
		this.setData({
			isLoading: true
		})
		this.getRecommendData(this.data.spuId)
	},
})
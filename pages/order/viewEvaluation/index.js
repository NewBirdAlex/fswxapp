import { apiUrl } from '../../../common/config.js'
import { $wuxToast } from '../../../components/wux'
import utils from '../../../common/utils/utils.js'
import client from '../../../common/utils/client';
import tracker from '../../../common/utils/tracker.js'
Page({
	data: {
		dataList: [],
		page: 1,
		noData: false,
		noMoreData: false,
		isLoading: false,
	},
	onLoad: function (options) {
		this.loadMore()
	},
	onShow: function () {

	},
	loadMore() {
		wx.showLoading({
			title: '正在加载...',
		})
		client.postData(apiUrl + "eb-api/oic/getOrderItemCommentByMemberId", {
			"memberId": "",
			"oicImgStatus": 0,
			"page": {
				"currentPage": this.data.page,
				"pageSize": 10
			},
			"skuId": "",
			"spuId": ""
		}).then(res => {
			wx.hideLoading()
			if (res.data.code === 200) {
				if (this.data.page == 1 && res.data.data.length == 0) {
					this.data.noData = true;
				}
				if (res.data.data.length < 10) {
					console.log(1)
					this.data.noMoreData = true;
				}
				this.data.page++;
				res.data.data.forEach((item, ind) => {
					item.oicImg = item.oicImg.split(",");
					let newArray = [];
					item.oicImg.forEach((val, index, arr) => {
						let obj = { "src": val };
						newArray.push(obj);
					})
					item.oicImg = newArray;
					this.data.dataList.push(item);
				});
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
	previewImage(e) {
		let _tihs = this;
		let index = e.currentTarget.dataset.index;
		let src = e.currentTarget.dataset.src;
		let arrImg = [];
		_tihs.data.dataList[index].oicImg.forEach(item=>{
			arrImg.push(item.src);
		})
		wx.previewImage({
			current: src,
			urls: arrImg
		})
	},
	onReachBottom: function () {
		if (!this.data.noMoreData) {
			this.loadMore()
		}
	},
})
// pages/search/index.js
import { apiUrl, apiUrl_cms } from '../../common/config.js';
// import { $wuxToast } from '../../components/wux'
import client from '../../common/utils/client';
Page({
	data: {
		dataList: [],
		keyWord: '',
		page: { currentPage: 1, pageSize: 10 },
		isLoading: false,
		noMoreData: false,
		noData: false,
	},
	onLoad: function (options) {
		this.setData({ keyWord: options.keyWord });
		this.loadData();
	},
	loadData: function () {
		wx.showLoading({
			title: '正在加载...',
		})
		client.postData(apiUrl_cms + 'cms-api/search/2.0.0/searchGoodsByKeyword', {
			"currentPage": this.data.page.currentPage,
			"keyword": this.data.keyWord,
			"pageSize": this.data.page.pageSize,
			"searchType": 2
		}).then(res => {
			wx.hideLoading();
			if (res.data.data.length < 10) {
				this.setData({
					noMoreData: true
				})
			}
			this.data.page.currentPage++;
			this.data.dataList = this.data.dataList.concat(res.data.data);
			this.setData({ 
				dataList: this.data.dataList,
				page: this.data.page,
				isLoading: false
			});
		}, res => {
			wx.hideLoading()
			console.log(res)
		})
	},
	onReachBottom: function () {
		if (this.data.noMoreData) {
			return
		}
		this.setData({
			isLoading: true
		})
		this.loadData();
	},
})
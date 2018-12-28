// pages/category/category.js
import { apiUrl, apiUrl_cms } from '../../common/config.js';
import { $wuxToast } from '../../components/wux'
import utils from '../../common/utils/utils.js'
import client from '../../common/utils/client';
import tracker from '../../common/utils/tracker.js';
const app = getApp();
Page({
	data: {
		fenceId: null,
		flowData: [],
		page: { currentPage: 1, pageSize: 10 },
		loadingMoreData: false,
		hasMoreData: false,
		categoryTagList: null,
		activeIndex: -1,
		tagId: "",
		movableWidth: 2000,
	},
	onLoad: function (options) {
		if (options.source != undefined) {
			wx.setStorageSync('sourceData', options.source)
		}
		wx.setNavigationBarTitle({ title: options.fenceName });
		this.setData({ fenceId: options.fenceId });
		if (options.category=='true'){
			this.getTagByFence(options.fenceId)
		}
		this.loadFlow(false);
	},
	loadFlow: function (loadingMore, tagId) {
		let method = "cms-api/goods/2.0.0/getContentListFence";
		let options = {
			"fenceId": this.data.fenceId, "currentPage": loadingMore ? this.data.page.currentPage + 1 : this.data.page.currentPage,
			"pageSize": this.data.page.pageSize, "tagId": tagId, "typeId": ""
		};
		client.postData(apiUrl_cms + method, options).then(res => {
			console.debug(res.data.data);
			if (loadingMore) {
				let page = this.data.page;
				page.currentPage++;
				let flowData = this.data.flowData;
				flowData = flowData.concat(res.data.data);
				this.setData({ flowData: flowData, page: page });
			} else {
				this.setData({ flowData: res.data.data });
			}
			if (res.data.data.length > 0) {
				this.setData({ hasMoreData: true, loadingMoreData: false });
			} else {
				this.setData({ hasMoreData: false, loadingMoreData: false });
			}
		}, res => {
			wx.hideLoading()
			console.log(res)
		})
	},
	getTagByFence(fenceId) {
		client.postData(apiUrl_cms + "cms-api/fence/2.0.0/getTagByFence", {
			"fenceId": fenceId
		}).then(res => {
			if (res.data.code === 200) {
				let width = 0;
				width = (res.data.data.typeList.length +1)*150;
				this.setData({
					categoryTagList: res.data.data.typeList,
					movableWidth: width
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
			$wuxToast.show({
				type: 'text',
				timer: 2000,
				color: '#fff',
				text: res.data.msg
			})
		})
	},
	tabClick: function (e) {
		if (this.data.activeIndex == e.currentTarget.id) return;
		this.data.page = 1;
		this.data.dataList = [];
		this.data.noData = false;
		this.setData({
			sliderOffset: e.currentTarget.offsetLeft,
			activeIndex: e.currentTarget.id,
			noData: this.data.noData,
			noMoreData: false,
		});
		let scrollX = 0;
		var screenWidth = wx.getSystemInfo({
			success: (res) => {
				screenWidth = res.windowWidth
				let leftPos = e.currentTarget.offsetLeft;
				if (leftPos <= screenWidth * 0.7) {
					scrollX = 0;
				} else {
					scrollX = -e.currentTarget.offsetLeft;
				}
				this.setData({
					scrollX: scrollX,
					sliderOffset: leftPos,
					activeIndex: e.currentTarget.id
				});
			}
		});
		let tagIndex = e.currentTarget.id == -1 ? "" : e.currentTarget.id;
		let tagId = tagIndex == "" ? "" : this.data.categoryTagList[tagIndex].tagId
		this.setData({
			page: { currentPage: 1, pageSize: 10 },
			loadingMoreData: false,
			hasMoreData: false,
			tagId: tagId
		});
		this.loadFlow(false, tagId)
	},
	onReachBottom: function () {
		if (this.data.loadingMoreData || !this.data.hasMoreData) {
			return;
		}
		this.loadFlow(true, this.data.tagId);
	},
})
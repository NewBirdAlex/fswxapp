import { apiUrl, apiUrl_cms } from '../../common/config.js';
// import { $wuxToast } from '../../components/wux'
import client from '../../common/utils/client';
import tracker from '../../common/utils/tracker.js';

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		swiper: {
			indicatorDots: true,
			autoPlay: true,
			interval: 3000,
			duration: 1000
		},
		mallHomeData: [],
		fenceData: [],
		flowFenceData: null,
		fenceTypeArr: [9, 16, 17, 20, 13],
		loadingMoreData: false,
		hasMoreData: false,
		page: { currentPage: 1, pageSize: 10 },
		inputShowed: false,
		inputVal: "",
		columnId: 10000,
		bannerFenceId: '',
    showButton:false
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
    if (apiUrl =="https://tapi.fshtop.com/"){
      this.setData({
        showButton:true
      });
    }

		if (options.source != undefined) {
			wx.setStorageSync('sourceData', options.source)
        }
        
        this.login().then(jumpToSongzan, jumpToSongzan);

        function jumpToSongzan(){
            if(options.songzan == 'true'){
                //console.log('跳转到松赞');
                wx.navigateTo({
                    url : '/subPackages/songzan/pages/index/index'
                });
            }
        }
	},

	onShow: function () {
		tracker.firstRead({ id: '101', title: '频道页' });
	},
  getUserInfo(e){
    console.log(e)
    this.login();
  },
	login(spuId) {
		let _this = this;
		// 登录
		return client.login().then(res => {
			console.log('login success', res);
            this.loadFence();
            return Promise.resolve(res);
		}, res => {
			console.log('login reject', res);
			loginCount++;
			//1001:用户拒绝允许授权获取信息,
			//1002:获取openId接口服务报错,
			//1003:获取openId接口网络错误,
			//1004:微信登录调用失败
			if (res.code == 1001) {
				wx.showModal({
					content: '请允许微信授权',
					success: res => {

					}
				})
			} else {
				wx.showModal({
					title: '提示',
					content: res.err,
					showCancel: false
				})
				if (loginCount == 3) {
					wx.showModal({
						title: '提示',
						content: '获取用户信息失败，请稍后再试',
						showCancel: false
					})
				}
            }
            return Promise.reject(res);
		});
	},

	showInput: function () {
		this.setData({
			inputVal: "",
			inputShowed: true
		});
	},
	searchInput: function () {
		if (this.data.inputVal == "") {
			wx.showModal({
				title: '提示',
				content: '请输入内容',
				showCancel: false,
			});
			return;
		}
		this.setData({
			inputShowed: false
		});
		wx.navigateTo({
			url: '/pages/search/index?keyWord=' + this.data.inputVal,
		})
	},
	clearInput: function () {
		this.setData({
			inputVal: ""
		});
	},
	inputTyping: function (e) {
		this.setData({
			inputVal: e.detail.value
		});
	},
	searchTracker: function (e) {
		tracker.trackData({ id: '101004', title: '"点击"搜索框' });
	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom: function () {
		if (this.data.loadingMoreData || !this.data.hasMoreData || !this.data.flowFenceData) {
			return;
		}
		this.loadFlow(this.data.flowFenceData, -1, this.data.page.currentPage + 1, this.data.page.pageSize, true);
	},
	/**
	 * 加载banner数据，fenceType==9
	 */
	loadBanner: function (fence, sortIndex) {
		let method = "cms-api/goods/2.0.0/getBannerByColumn";
		let options = { 'fenceId': fence.fenceId };
		console.log(fence);
		this.request(method, options, fence, sortIndex, false);
	},
	/**
     * 加载导航数据，fenceType==16
     */
	loadChildFenceByFence: function (fence, sortIndex) {
		let method = "cms-api/fence/2.0.0/getChildrenFenceByFence";
		let options = { 'fenceId': fence.fenceId };
		this.request(method, options, fence, sortIndex, false);
	},
	/**
	 * 加载瀑布流数据，fenceType==20， 13， 17
	 */
	loadFlow: function (fence, sortIndex, currentPage, pageSize, loadingMore) {
		let method = "cms-api/goods/2.0.0/getContentListFence";
		let options = {
			"fenceId": fence.fenceId, "currentPage": currentPage,
			"pageSize": pageSize, "tagId": "", "typeId": ""
		};
		if (fence.fenceType === 13) {
			this.data.flowFenceData = fence;
		}
		this.request(method, options, fence, sortIndex, loadingMore);
	},

	request: function (method, options, fence, sortIndex, loadingMore) {
		client.postData(apiUrl_cms + method, options).then(res => {
			this.handleResponse(res, fence, sortIndex, loadingMore);
		}, res => {
			wx.hideLoading()
			console.log(res)
		})
	},


	loadFence: function () {
		let _this = this;
		wx.showLoading({
			title: '加载数据...',
			mask: true
		})
		client.postData(apiUrl_cms + "cms-api/goods/2.0.0/getFence", {}).then(res => {
			wx.hideLoading()
			if (res.data.code != 200) {
				return;
			}
			console.debug(res.data.data)
			//过滤不需要展示和不认识的fence
			res.data.data.forEach((item, index) => {
				if (_this.data.fenceTypeArr.indexOf(item.fenceType) > -1) {
					_this.data.fenceData.push(item)
				}
			})

			_this.data.fenceData.forEach((item, index) => {
				switch (item.fenceType) {
					case 9:
						_this.loadBanner(item, index);
						_this.setData({
							bannerFenceId: item.fenceId
						})
						break;
					case 16:
						// case 18:
						_this.loadChildFenceByFence(item, index);
						break;
					case 13:
					case 17:
					case 20:
						_this.loadFlow(item, index, 1, 10, false);
						break;
				}
			})
		}, res => {
			wx.hideLoading()
			console.log(res)
		})
	},
	handleResponse: function (res, fence, sortIndex, loadingMore) {
		let homeData = this.data.mallHomeData;
		let hasMoreData = this.data.hasMoreData;
		let loadingMoreData = this.data.loadingMoreData;
		let page = this.data.page;

		if (fence.fenceType === 17) {
			if (res.data.data.length > 1) {
				res.data.data.forEach((item, index) => {
					item.flashSale = true;
				})

				homeData.push({ "fence": fence, "data": res.data.data.slice(1, 10), "first": res.data.data[0], "sortIndex": sortIndex });
				homeData.sort(function (a, b) {
					return a.sortIndex - b.sortIndex;
				});
			}
		} else {
			if (fence.fenceType == 13) {
				if (res.data.data.length > 0) {
					hasMoreData = true;
					loadingMoreData = false;
				} else {
					hasMoreData = false;
					loadingMoreData = false;
				}
			}
			//只支持瀑布流加载更多
			if (loadingMore) {
				page.currentPage++;
				let flow = homeData[homeData.length - 1].data;
				homeData[homeData.length - 1].data = flow.concat(res.data.data);
			} else {
				homeData.push({ "fence": fence, "data": res.data.data.slice(0, 10), "sortIndex": sortIndex });
			}

			homeData.sort(function (a, b) {
				return a.sortIndex - b.sortIndex;
			});
		}

		this.setData({
			page: page,
			mallHomeData: homeData,
			hasMoreData: hasMoreData,
			loadingMoreData: loadingMoreData
		});
	},
	swiperNavigation(e) {
		tracker.trackData({ id: '101010', title: '栏位内容"点击"', object2: e.currentTarget.dataset.id, object1: this.data.bannerFenceId});
		let jumpType = e.currentTarget.dataset.jumptype;
		let index = e.currentTarget.dataset.index;
		let bindex = e.currentTarget.dataset.bindex;
		if (jumpType==6){
			client.postData(apiUrl_cms + "cms-api/component/2.0.0/detail", {
				"componentId": e.currentTarget.dataset.id
			}).then(res => {
				wx.hideLoading()
				if (res.data.code != 200) {
					return;
				}
				wx.navigateTo({
					url: '/pages/goodsDetail/index?spuId=' + res.data.data.spuId,
				})
			}, res => {
				wx.hideLoading()
				console.log(res)
			})
		} else if (jumpType==7){
			let fenceData = this.data.mallHomeData[index].data[bindex];
			wx.navigateTo({
				url: '/pages/category/category?fenceId=' + fenceData.fenceResp.fenceId + '&fenceName=' + fenceData.fenceResp.fenceName,
			})
		}
	},
	trackerChannel: function (e) {
		tracker.trackData({ id: '101005', title: '点击选择频道', object1: e.currentTarget.dataset.fenceid });
	},

	viewMore: function (e) {
		console.log(e.currentTarget.dataset.fenceid)
		// tracker.trackData({ id: '101008', title: '栏位查看全部' });
	},

	onShareAppMessage: function () {
		return {
			// title: '丰盛榜健康生活方式商城',
			title: '精选全球健康好物100%正品安全放心给你带来丰盛健康生活',
			path: '/pages/index/index',
			success: function (res) {
				// 转发成功
			},
			fail: function (res) {
				// 转发失败
			}
		}
	}

})
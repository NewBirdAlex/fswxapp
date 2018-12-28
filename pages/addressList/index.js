import { apiUrl } from '../../common/config.js'
import { $wuxToast } from '../../components/wux'
import utils from '../../common/utils/utils.js'
import client from '../../common/utils/client';
import tracker from '../../common/utils/tracker.js';
const app = getApp()
Page({
	data: {
		showModalStatus: false,
		addressAll: [],
		addressMore: [],
		name: "",
		tel: "",
		province: [],
		city: [],
		distric: [],
		detail: "",
		areaList: [],
		provinceName: [],
		districName: [],
		cityName: [],
		column: "",
		changeValue: "",
		multiIndex: [0, 0, 0],
		multiArray: [],
		currentId: "",
		chooseDefault: "0",
		lastArray: ["北京市", "北京城区", "东城区"],
		page: 1,
		title: "",
		allPage: "",
		column: '',
		firstName: [],
		secondName: [],
		useBtnShow: true,


	},
	onLoad: function (options) {
		let _this = this;
		this.page = 1;
		this.setData({
			useBtnShow: options.show == "true" ? true : false
		})
		this.getAddressList();
		this.getProvince();
		wx.getSystemInfo({
			success: function (res) {
				_this.setData({
					windowHeight: res.windowHeight,
					windowWidth: res.windowWidth
				})
			}
		});
	},
	onShow:function() {
		tracker.firstRead({ id: '712', title: '地址管理页' });
	},
	onReachBottom: function () {
		if (this.data.page <= this.data.allPage) {
			this.getAddressList();
		}
	},
	//获取地址列表
	getAddressList: function () {
		let _this = this;
		if (_this.data.page < this.data.allPage) {
			wx.showLoading({
				title: '加载中',
			})
		}
		client.postData(apiUrl + "eb-api/ma/getMemberAddressByMemberId", { 
			"page": {
				"currentPage": _this.data.page,
				"pageSize": 5,
				surechoosed: false,
			}
		 }).then(res => {
			wx.hideLoading()
			if (res.data.code === 200) {
				setTimeout(function () {
					wx.hideLoading()
				}, 1000)
				_this.data.page++;
				res.data.data.forEach((item, index) => {
					_this.data.addressAll.push(item);
				})
				_this.setData({
					addressAll: _this.data.addressAll,
					allPage: res.data.page.totalPage
				});
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
	//获取收货地址的内容
	getInfo: function (e) {
		tracker.trackData({ id: '712003', title: '编辑地址' });
		var provinceIndex;
		var cityIndex;
		var districIndex;
		var provinceCode;
		var cityCode;
		let _this = this;
		this.data.provinceName = [];
		this.data.province.forEach((item, index) => {
			this.data.provinceName.push(item.name)
			if (item.name == e.currentTarget.dataset.item.madProvince) {
				provinceCode = item.code
				provinceIndex = index;
			}
		})
		this.data.cityName = [];
		this.data.city.forEach((item, index) => {
			if (item.pcode == provinceCode) {
				this.data.cityName.push(item.name)
			}
			if (item.name == e.currentTarget.dataset.item.madCity) {
				cityCode = item.code
				cityIndex = index;
			}
		})
		this.data.cityName.forEach((item, index) => {
			if (item == e.currentTarget.dataset.item.madCity) {
				cityIndex = index;

			}
		})
		this.data.districName = [];
		this.data.distric.forEach((item, index) => {
			if (item.pcode == cityCode) {
				this.data.districName.push(item.name)

			}
		})
		this.data.districName.forEach((item, index) => {
			if (item == e.currentTarget.dataset.item.madTown) {
				districIndex = index;
			}
		})
		this.setData({
			showModalStatus: true,
			name: e.currentTarget.dataset.item.madReceiver,
			tel: e.currentTarget.dataset.item.madMobile,
			lastArray: [e.currentTarget.dataset.item.madProvince, e.currentTarget.dataset.item.madCity, e.currentTarget.dataset.item.madTown],
			detail: e.currentTarget.dataset.item.madAddressDetail,
			chooseDefault: e.currentTarget.dataset.item.madDefault,
			currentId: e.currentTarget.dataset.item.madId,
			title: 1,
			multiIndex: [provinceIndex, cityIndex, districIndex],
			multiArray: [this.data.provinceName, this.data.cityName, this.data.districName],

		})
	},
	//点击添加地址
	util: function (e) {
		tracker.trackData({ id: '712002', title: '点击新增地址' });
		let _this = this;
		_this.data.cityName = []
		_this.data.city.forEach((item, index) => {
			if (item.pcode == "110000") {
				_this.data.cityName.push(item.name)
			}
		})

		_this.data.districName = [];
		_this.data.distric.forEach((item, index) => {
			if (item.pcode.substring(0, 3) == "110") {
				_this.data.districName.push(item.name)
			}
		})
		//手动添加
		if (e.currentTarget.id == "1") {
			this.setData({
				showModalStatus: true,
				currentId: e.currentTarget.id,
				name: '',
				tel: '',
				detail: '',
				lastArray: ["北京市", "北京城区", "东城区"],
				title: 0,
				multiIndex: [0, 0, 0],
				multiArray: [this.data.provinceName, this.data.cityName, this.data.districName]
			})
		}
		//微信添加
		if (e.currentTarget.id == "2") {
			wx.getSetting({
				success: res => {
					console.log(res)
					if (res.authSetting['scope.address']) { //获取用户是否已经授权
						this.chooseAddressWX()
					} else {
						wx.authorize({
							scope: 'scope.address',
							success: (res) => {
								_this.chooseAddressWX()
							},
							fail: (res) => {
								console.log(res)
								wx.showModal({
									title: '提示',
									content: '你拒绝了收货地址授权，这会影响小程序的体验及功能，是否打开设置重新授权',
									success: function (res) {
										if (res.confirm) {
											wx.openSetting({
												success: (res) => {
													_this.chooseAddressWX()
												}
											})
										}
									}
								})

							}
						})
					}
				}
			})

		}
	},
	chooseAddressWX: function () {
		let _this = this;
		wx.chooseAddress({
			success: function (res) {
				wx.showLoading({
					title: '加载中',
				})
				client.postData(apiUrl + "eb-api/ma/createMemberAddress", {
					"madAddressDetail": res.detailInfo,
					"madCity": res.cityName,
					"madDefault": 0,
					"madMobile": res.telNumber,
					"madPostCode": 'string',
					"madProvince": res.provinceName,
					"madReceiver": res.userName,
					"madTown": res.countyName
				}).then(res => {
					wx.hideLoading()
					if (res.data.code === 200) {
						setTimeout(function () {
							wx.hideLoading()
						}, 1000)
						wx.showToast({
							title: '添加成功',
							icon: 'success',
							duration: 2000
						})
						_this.setData({
							page: 1,
							showModalStatus: false,
							title: 0,
							addressAll: []
						})
						_this.getAddressList();
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
		})
	},
	bindKeyName: function (e) {
		this.setData({
			name: e.detail.value,
		})
	},
	bindKeyTel: function (e) {
		this.setData({
			tel: e.detail.value,
		})
	},
	bindKeyDetail: function (e) {
		this.setData({
			detail: e.detail.value,
		})
	},
	useAddress: function (e) {
		console.log(e.currentTarget.dataset.item)
		let item = e.currentTarget.dataset.item;
		wx.setStorageSync("chosenAddress", {
			errMsg: "",
			madId: item.madId,
			userName: item.madReceiver,
			nationalCode: "",
			telNumber: item.madMobile,
			postalCode: "",
			provinceName: item.madProvince,
			cityName: item.madCity,
			countyName: item.madTown,
			detailInfo: item.madAddressDetail
		})
		wx.navigateBack({
			delta: 1
		})
	},
	//删除收货地址
	deleteAddress: function (e) {
		tracker.trackData({ id: '712005', title: '删除地址' });
		let _this = this;
		let madId = this.data.addressAll[e.currentTarget.id].madId
		wx.showModal({
			title: '提示',
			content: '确认删除吗？',
			success: function (res) {
				if (res.confirm) {
					wx.showLoading({
						title: '加载中',
					})
					client.postData(apiUrl + "eb-api/ma/deleteMemberAddress?madId=" + madId, {}).then(res => {
						wx.hideLoading()
						if (res.data.code === 200) {
							setTimeout(function () {
								wx.hideLoading()
							}, 1000)
							wx.showToast({
								title: '删除成功',
								icon: 'success',
								duration: 2000
							})
							_this.data.addressAll.forEach((item, index) => {
								if (item.madId == madId) {
									_this.data.addressAll.splice(index, 1)
								}
							})
							_this.setData({
								showModalStatus: false,
								addressAll: _this.data.addressAll
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
	//新增编辑收货地址
	powerDrawer: function (e) {
		tracker.trackData({ id: '724003', title: '点击保存' });
		if (e.currentTarget.id == 0) {
			let _this = this;
			if (this.data.name == '') {
				wx.showModal({
					title: '提示',
					content: '请输入姓名',
				})
				return;
			}
			if (this.data.tel == '' || !/^1(3|4|5|7|8)\d{9}$/.test(this.data.tel)) {
				wx.showModal({
					title: '提示',
					content: '请输入正确联系方式',
				})
				return;
			}
			if (this.data.detail == '') {
				wx.showModal({
					title: '提示',
					content: '请输入详细地址',
				})
				return;
			}

			if (this.data.currentId == "1") {
				wx.showLoading({
					title: '加载中',
				})
				client.postData(apiUrl + "eb-api/ma/createMemberAddress", {
					"madAddressDetail": _this.data.detail,
					"madCity": _this.data.lastArray[1],
					"madDefault": _this.data.chooseDefault,
					"madMobile": _this.data.tel,
					"madPostCode": 'string',
					"madProvince": _this.data.lastArray[0],
					"madReceiver": _this.data.name,
					"madTown": _this.data.lastArray[2]
				}).then(res => {
					wx.hideLoading()
					if (res.data.code === 200) {
						setTimeout(function () {
							wx.hideLoading()
						}, 1000)
						wx.showToast({
							title: '添加成功',
							icon: 'success',
							duration: 2000
						})
						_this.setData({
							page: 1,
							showModalStatus: false,
							title: 0,
							addressAll: []
						})
						_this.getAddressList();
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
			} else {
				wx.showLoading({
					title: '加载中',
				})
				_this.data.addressAll.forEach((item, index) => {
					if (item.madId == _this.data.currentId) {
						item.madAddressDetail = _this.data.detail,
							item.madCity = _this.data.lastArray[1],
							item.madDefault = _this.data.chooseDefault,
							item.madMobile = _this.data.tel,
							item.madPostCode = 'string',
							item.madProvince = _this.data.lastArray[0],
							item.madReceiver = _this.data.name,
							item.madTown = _this.data.lastArray[2]
					}
				})
				client.postData(apiUrl + "eb-api/ma/editMemberAddress", {
					"madAddressDetail": _this.data.detail,
					"madCity": _this.data.lastArray[1],
					"madDefault": _this.data.chooseDefault,
					"madMobile": _this.data.tel,
					"madPostCode": 'string',
					"madProvince": _this.data.lastArray[0],
					"madReceiver": _this.data.name,
					"madTown": _this.data.lastArray[2],
					"madId": _this.data.currentId
				}).then(res => {
					wx.hideLoading()
					if (res.data.code === 200) {
						setTimeout(function () {
							wx.hideLoading()
						}, 1000)
						wx.showToast({
							title: '编辑成功',
							icon: 'success',
							duration: 2000
						})

						_this.setData({
							showModalStatus: false,
							addressAll: _this.data.addressAll,

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
		} else {
			this.setData({
				showModalStatus: false,
			})
		}

	},
	//获取省市区
	bindMultiPickerChange: function (e) {
		this.setData({
			lastArray: [this.data.multiArray[0][this.data.multiIndex[0]], this.data.multiArray[1][this.data.multiIndex[1]], this.data.multiArray[2][this.data.multiIndex[2]]]
		})
	},
	//确定地区选项
	bindMultiPickerColumnChange: function (e) {
		this.data.multiIndex[e.detail.column] = e.detail.value;
		var data = {
			multiArray: this.data.multiArray,
			multiIndex: this.data.multiIndex
		};
		if (e.detail.column == 0) {
			this.data.provinceName = [];
			this.data.province.forEach((item, index) => {
				this.data.provinceName.push(item.name);
			})
			this.data.cityName = []
			this.data.city.forEach((item, index) => {
				if (this.data.province.find(sitem => this.data.province[e.detail.value].code == item.pcode)) {
					this.data.cityName.push(item.name);
				}
			})
			this.data.districName = []
			this.data.city.forEach((item, index) => {
				if (this.data.cityName[0] == item.name) {
					this.data.distric.forEach((sitem, index) => {
						if (sitem.pcode == item.code) {
							this.data.districName.push(sitem.name);
						}
					})
				}
			})
			this.data.multiIndex[1] = 0;
			this.data.multiIndex[2] = 0;
		}
		if (e.detail.column == 1) {
			this.data.districName = []
			this.data.city.forEach((item, index) => {
				if (this.data.cityName[e.detail.value] == item.name) {
					this.data.distric.forEach((sitem, index) => {
						if (sitem.pcode == item.code) {
							this.data.districName.push(sitem.name);
						}
					})
				}
			})
			this.data.multiIndex[2] = 0;
		}
		if (this.data.title == 0) {
			switch (e.detail.column) {
				case 0:
					data.multiArray[1] = this.data.cityName;
					data.multiArray[2] = this.data.districName;
					break;
				case 1:
					data.multiArray[2] = this.data.districName;
					break;
			}
		} else {
			switch (e.detail.column) {
				case 0:
					data.multiArray[1] = this.data.cityName;
					data.multiArray[2] = this.data.districName;
					break;
				case 1:
					data.multiArray[2] = this.data.districName;
					break;
				case 2:
					data.multiArray[2] = this.data.districName;
			}
		}
		this.setData(data);
	},
	//确认省市区
	bindDateChange: function (e) {
		this.setData({
			date: e.detail.value,
		})
	},
	//设置默认地址
	sureDefault: function (e) {
		tracker.trackData({ id: '712004', title: '勾选默认地址' });
		let _this = this;
		var lastIndex = '';
		var resultItem = '';
		this.setData({
			name: e.currentTarget.dataset.item.madReceiver,
			tel: e.currentTarget.dataset.item.madMobile,
			lastArray: [e.currentTarget.dataset.item.madProvince, e.currentTarget.dataset.item.madCity, e.currentTarget.dataset.item.madTown],
			detail: e.currentTarget.dataset.item.madAddressDetail,
			chooseDefault: "1",
			currentId: e.currentTarget.dataset.item.madId
		})
		wx.showLoading({
			title: '加载中',
		})
		client.postData(apiUrl + "eb-api/ma/editMemberAddress", {
			"madAddressDetail": _this.data.detail,
			"madCity": _this.data.lastArray[1],
			"madDefault": _this.data.chooseDefault,
			"madMobile": _this.data.tel,
			"madPostCode": 'string',
			"madProvince": _this.data.lastArray[0],
			"madReceiver": _this.data.name,
			"madTown": _this.data.lastArray[2],
			"madId": _this.data.currentId
		}).then(res => {
			wx.hideLoading()
			if (res.data.code === 200) {
				setTimeout(function () {
					wx.hideLoading()
				}, 1000)
				_this.data.addressAll.forEach((item, index) => {
					if (item.madId == _this.data.currentId) {
						item.madDefault = 1;
					} else {
						item.madDefault = 0;
					}
				})
				_this.setData({
					addressAll: _this.data.addressAll
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
	//获取省市区
	getProvince: function () {
		let _this = this;
		wx.showLoading({
			title: '加载中',
		})
		client.postData(apiUrl + "eb-api/area/areaList", {}).then(res => {
			wx.hideLoading()
			if (res.data.code === 200) {
				setTimeout(function () {
					wx.hideLoading()
				}, 1000)
				res.data.data.cityAndDistrictList.forEach((item, index) => {
					if (item.pcode == 0) {
						_this.data.province.push({ name: item.name, code: item.code, pcode: item.pcode });
					} else if (item.pcode.substring(2, 6) == 0) {
						_this.data.city.push({ name: item.name, code: item.code, pcode: item.pcode })
					} else if (item.code.substring(2, 6) != 0) {
						_this.data.distric.push({ name: item.name, code: item.code, pcode: item.pcode })
					}
				})
				_this.data.province.forEach((item, index) => {
					_this.data.provinceName.push(item.name);
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
})
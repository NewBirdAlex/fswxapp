var MD5 = require('../libs/md5.min')
import { apiUrl } from "../config.js"

const formatTime = date => {
	date = new Date(date)
	const year = date.getFullYear()
	const month = date.getMonth() + 1
	const day = date.getDate()
	const hour = date.getHours()
	const minute = date.getMinutes()
	const second = date.getSeconds()

	return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatDateNoHour = date => {
	date = new Date(date)
	const year = date.getFullYear()
	const month = date.getMonth() + 1
	const day = date.getDate()

	return [year, month, day].map(formatNumber).join('.')
}

const getDateStr = (AddDayCount, index) => {
	let dd = new Date();
	dd.setDate(dd.getDate() + AddDayCount);
	let y = dd.getFullYear();
	let m = (dd.getMonth() + 1) < 10 ? '0' + (dd.getMonth() + 1) : '' + (dd.getMonth() + 1);
	let d = dd.getDate() < 10 ? '0' + dd.getDate() : '' + dd.getDate();
	let h = dd.getHours() < 10 ? '0' + dd.getHours() : '' + dd.getHours();
	let mo = dd.getMinutes() < 10 ? '0' + dd.getMinutes() : '' + dd.getMinutes();
	let s = dd.getSeconds() < 10 ? '0' + dd.getSeconds() : '' + dd.getSeconds();
	if(index=='noHour'){
		return y + "." + m + "." + d;
	}else{
		return y + "-" + m + "-" + d + " " + h + ":" + mo + ":" + s;
	}
}

const getDiffDate = time =>{
	if (time.toString().length != 13) {
		time = time * 1000;
	}
	let diff = (time - new Date().getTime()) / 1000;
	let dateData = {
		years: 0,
		days: 0,
		hours: 0,
		min: 0,
		sec: 0,
		millisec: 0,
	}
	if (diff <= 0) {
		return -1;
	}
	if (diff >= (365.25 * 86400)) {
		dateData.years = Math.floor(diff / (365.25 * 86400));
		diff -= dateData.years * 365.25 * 86400;
	}
	if (diff >= 86400) {
		dateData.days = Math.floor(diff / 86400);
		diff -= dateData.days * 86400;
	}
	if (diff >= 3600) {
		dateData.hours = formatDate(Math.floor(diff / 3600));
		diff -= dateData.hours * 3600;
	}
	if (diff >= 60) {
		dateData.min = formatDate(Math.floor(diff / 60));
		diff -= dateData.min * 60;
	}
	dateData.sec = formatDate(Math.round(diff));
	dateData.millisec = diff % 1 * 1000;
	return dateData
}

const formatNumber = n => {
	n = n.toString()
	return n[1] ? n : '0' + n
}

function formatDate(d) {
	if (d < 10) {
		return "0" + d
	}
	return d
}

function onSubmitFromId(formId, state) {
	if (formId != 'the formId is a mock one') {
		wx.request({
			url: apiUrl + 'cms-pay/wechat/1.0.0/form/add',
			data: {
				"formId": formId,
				"appId": this.globalData.appId,
				"fromType": state,//0=普通表单，1=支付 
				"openId": wx.getStorageSync("tokenInfo").openId
			},
			method: 'POST',
			header: {
				'content-type': 'application/json',
			},
			success: (res) => {
				console.log(res)
			},
			fail: (res) => {
				console.log(res);
			}
		})
	}
}



module.exports = {
	formatTime: formatTime,
	getDateStr: getDateStr,
	formatDateNoHour: formatDateNoHour,
	formatNumber: formatNumber,
	onSubmitFromId: onSubmitFromId,
	getDiffDate: getDiffDate,
}

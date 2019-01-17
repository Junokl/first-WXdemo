var app = getApp();
var request = app.request;
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;

Page({
  data: {
    url: app.globalData.setting.url,
    requestData: null,
    typeId: 1,
    currentPage: 1,
    // isget:0, //0："立即领取" 1："立即使用" 3："过期失效"
    activeStatus: '0',
    list: [],
    coupon_list: []
  },

  onLoad: function (options) {
    // console.log(options);
    load.init(this, 'coupon_list', 'requestData');
    load.resetConfig();
    this.data.requestData = null;
    this.data.currentPage = 1;
    this.requestCouponList(this.data.typeId);
  },

  // 选项卡

  changeTab: function (e) {
    this.reloadCouponList(e.currentTarget.dataset.id);
  },

  requestCouponList: function (typeId) {
    var that = this;
    that.setData({ typeId: typeId });
    var requestUrl = '/api/activity/coupon_list?type=' + typeId + '&p=' + that.data.currentPage;
    load.request(requestUrl, function (res) {
      that.data.currentPage++;
      for (let i = 0; i < res.data.result.coupon_list.length; i++) {
        var val = res.data.result.coupon_list[i];
        if (res.data.result.store_arr[val.store_id] == undefined) {
          continue;
        }
        val.store_name = res.data.result.store_arr[val.store_id].store_name;
        val.store_logo = res.data.result.store_arr[val.store_id].store_logo;
      }
      wx.stopPullDownRefresh();
    });
  },

  // 点击事件  领取优惠劵
  lingQu: function (e) {
    var coupon_id = e.currentTarget.dataset.cid;
    var isget = e.currentTarget.dataset.isget;
    var store_id = e.currentTarget.dataset.store_id;
    var index = e.currentTarget.dataset.index;
    var that = this;
    if (isget == 1) {
      wx.navigateTo({
        url: '/pages/store/index/index?store_id=' + store_id
      })
    } else {
      request.post('/api/activity/get_coupon', {
        data: { coupon_id: coupon_id },
        success: function (res) {
          var oldList = that.data.requestData.coupon_list;
          var newList = [];
          oldList.some((item, i) => {
            if (i == index) {
              item.isget = 1;
            }
            newList.push(item)
          })
          that.setData({'requestData.coupon_list': newList})
        },
        fail: function (res) {
        }
      })
    }
  },


  onReachBottom: function () {
    if (load.canloadMore()) {
      this.requestCouponList(this.data.typeId);
    }
  },

  onPullDownRefresh: function () {
    this.reloadCouponList(this.data.typeId);
  },

  //重置数据
  reloadCouponList: function (typeId) {
    load.resetConfig();
    this.data.requestData = null;
    this.data.currentPage = 1;
    this.requestCouponList(typeId);
  },

});
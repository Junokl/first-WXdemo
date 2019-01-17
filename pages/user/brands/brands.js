var app = getApp();
var request = app.request;
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;
var setting = app.globalData.setting;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentPage: 1,
    goodslist: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    load.init(this, '', 'goodslist');
    this.requestList();
  },

  changeTopTab: function (e) {
    this.setData({
      currentTab: e.currentTarget.dataset.idx
    })
    load.resetConfig();
    this.data.currentPage = 1;
  },

  goodHandler(e) {
    let id = e.currentTarget.dataset.id;
    let name = e.currentTarget.dataset.name;
    wx.navigateTo({
      url: `/pages/user/brand_list/brand_list?id=${id}&name=${encodeURIComponent(name)}`,
    });
  },

  requestList: function () {
    var that = this;
    var requestUrl = '/api/user/getAgentBrands?p=' + that.data.currentPage;
    load.request(requestUrl, function (res) {
      that.data.currentPage++;
      wx.stopPullDownRefresh();
    });
  },

  onPullDownRefresh: function () {
    this.reloadGoodList();
  },

  //重置数据
  reloadGoodList: function () {
    load.resetConfig();
    this.data.goodslist = null;
    this.data.currentPage = 1;
    this.requestList();
  },

  onReachBottom: function () {
    if (load.canloadMore()) {
      this.requestList();
    }
  },

})
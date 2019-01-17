var app = getApp();
var request = app.request;
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;
var setting = app.globalData.setting;
var api_token = require('../../../utils/token.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    user: "",
    type: 0,//type=0 点击分享记录
    sizePrice_num: 0,//总金额
    bigPrice_num: 0,//总金额
    sizeFriend_num: 0,//邀请了几个朋友
    bigFriend_num: 0,//邀请多少个朋友才可升级（任务）
    currentTab: 0,
    currentPage: 1,
    topBar: [
      { name: "分享记录" },
      { name: "亲朋好友" }
    ],
    list: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    // console.log(options);
    load.init(this, '', 'list');
    var type = typeof options.type == 'undefined' ? this.data.type : options.type;
    app.getUserInfo(function (userInfo) {
      that.setData({
        user: userInfo,
        type: type
      });
    });
    this.resetData();
    this.getMoney();
    this.requestFn(type);
  },

  getMoney: function () {
    var that = this;
    // 发起请求，获取总金额
    request.post('/api/goods/getShareVolume', {
      data: {},
      success: function (res) {
        for (var i = 0; i < res.data.result.length; i++) {
          if (i == 0) {
            that.setData({
              sizePrice_num: res.data.result[i],
              bigPrice_num: res.data.result[i + 1]
            })
          }
        }
      },
      fail: function (res) {
      }
    });
  },

  // 点击事件
  changeTopTab: function (e) {
    this.setData({
      currentTab: e.currentTarget.dataset.idx,
      type: e.currentTarget.dataset.idx
    });
    this.resetData();
    this.requestFn(e.currentTarget.dataset.idx);
  },

  requestFn: function (type) {
    var that = this;
    var user_id = this.data.user.user_id;
    this.setData({ type: type });
    if (type == 0) {
      var requestUrl = '/api/goods/getShareRecord?p=' + that.data.currentPage;
      load.request(requestUrl, function () {
        that.data.currentPage++;
      });
    }
    else if (type == 1) {
      var token = api_token.api_token('public', 'private')
      load.requestPostUser('/api/TeamUsers/getFriend', {
        user_id: user_id,
        page: that.data.currentPage,
        public: token.token,
        timestamp: token.timestamp,
        nonceStr: token.nonceStr,
        sign: token.sign,
        limit: 20
      }, function (res) {
        if (res.data.status == 200) {
          that.data.currentPage++;
          that.setData({
            sizeFriend_num: res.data.data.difference,
            bigFriend_num: res.data.data.underling_number
          })
        }
      });
    }

  },

  /**
   * 转发按钮
   */
  onShareAppMessage: function (res) {
    return setting.share;
  },
  /** 重置数据 */
  resetData: function () {
    this.data.list = null;
    if (this.data.type == 0) {
      load.init(this, '', 'list');
      load.resetConfig();
    } else if (this.data.type == 1) {
      load.init(this, 'list', 'list');
      load.resetConfig();
    }
    this.data.currentPage = 1;
  },

  // 下拉刷新
  onPullDownRefresh: function (e) {
    this.resetData();
    this.getMoney();
    this.requestFn(this.data.type);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    var that = this;
    this.getMoney();
    this.requestFn(that.data.type);
  },

})
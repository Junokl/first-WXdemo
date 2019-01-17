var app = getApp();
var request = app.request;
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;
var setting = app.globalData.setting;
var api_token = require('../../../utils/token.js');
import util from '../../../utils/util.js';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    level: null,//level=1代表普通会员，level=2代表VIP，level=3代表团长
    teamMember: null,
    currentPage: 1,
    currentTab: 0,
    topBar: [
      { name: "直属粉丝" },
      { name: "推荐粉丝" }
    ],
    list: [],
    user_id: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    load.init(this, '', 'list');
    this.resetData();
    var user = wx.getStorageSync('app:userInfo');
    this.setData({ 
      level: user.level,
      user_id: user.user_id
    });

    this.getTeamList(this.data.currentTab);
  },

  changeTopTab: function (e) {
    this.setData({
      currentTab: e.currentTarget.dataset.idx
    });
    this.resetData();
    this.getTeamList(this.data.currentTab);
  },

  getTeamList: function (currentTab) {
    var that = this;
    var token = api_token.api_token('public', 'private');
    load.requestPostUser('/api/TeamUsers/getTeam', {
      type: currentTab,
      user_id: wx.getStorageSync('app:userInfo').user_id,
      page: that.data.currentPage,
      public: token.token,
      timestamp: token.timestamp,
      nonceStr: token.nonceStr,
      sign: token.sign,
      limit: 20
    }, function (res) {
      if (res.data.status == 200) {
        that.data.currentPage++;
        if (res.data.data != null) {
          res.data.data.forEach(function (val, index, arr) {
            val.regTime = util.format(val.reg_time, 'yyyy-MM-dd');
          });
        }
      }
      wx.stopPullDownRefresh();
    });

  },

  /** 重置数据 */
  resetData: function () {
    load.resetConfig();
    this.data.list = null;
    this.data.currentPage = 1;
  },

  // 下拉刷新
  onPullDownRefresh: function (e) {
    var that = this;
    this.resetData();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    var that = this;
    this.getTeamList(this.data.currentTab);
  },

  /**
   * 转发按钮
   */
  onShareAppMessage: function (res) {
    return setting.share;
  },
})
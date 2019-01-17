var app = getApp();
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;
var util = require('../../../utils/util.js');
var setting = app.globalData.setting;
var request = app.request;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    user:"",
    userCodeLink: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that=this;
    var type = typeof options.type == 'undefined' ? this.data.activeType : options.type;
    load.init(this, '', 'points');
    wx.getStorage({
      key: 'app:userInfo',
      success: function(res) {
        that.setData({user:res.data});
        request.post('/api/goods/wxacodeGoodsPoster', {
          data: {
            scene: "f=" + that.data.user.user_id + "&i="+ that.data.user.invitationCode,
            page: 'pages/index/index/index',
            width: 300,
          },
          success(res) {
            that.setData({userCodeLink: res.data.result})
          }
        })
      }
    });
    
  },

  onPullDownRefresh: function () {
    wx.stopPullDownRefresh()
  },

  // 点击按钮分享 
  btn_share:function (){
    var that=this;
    
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return setting.share;
  }
})
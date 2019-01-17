// pages/user/account_details/account_details.js
var app = getApp();
var request = app.request;

Page({

  data: {
    url: app.globalData.setting.url,
    userInfo: wx.getStorageSync('app:userInfo') || {},
    commission_info: {},
    isQuestionShow: false,
    questionList: [
      [
        "上月结算：上个月团长分销商品的总佣金(不包括退款的)",
        "本月预估：这个月团长分销商品的总佣金(包括退款的)",
        "上月预估：上个月团长分销商品的总佣金(包括退款的)"
      ],
      [
        "结算收入：今天团长分销商品的总佣金(不包括退款的)",
        "付款笔数：今天团长自己或者下线付款笔数(包括退款的)",
        "预估佣金：今天团长分销商品的总佣金(包括退款的)"
      ],
      [
        "结算收入：昨天团长分销商品的总佣金(不包括退款的)",
        "付款笔数：昨天团长自己或者下线付款笔数(包括退款的)",
        "预估佣金：昨天团长分销商品的总佣金(包括退款的)"
      ]
    ],
    showQuestion: []
  },

  onLoad: function (options) {
    this.requestCommission();
  },

  downloadApp() {
    var that = this;
    wx.showModal({
      title: '温馨提示',
      content: '亲，该功能仅在APP开放使用哦~现在下载美记APP，享受更多会员权益！将复制的链接在浏览器打开即可下载安装！',
      cancelText: '取消',
      confirmText: '复制链接',
      success(res) {
        if (res.confirm) {
          that.copyDownloadLink();
        }
      }
    })
  },

  copyDownloadLink() {
    wx.setClipboardData({
      data: 'http://a.app.qq.com/o/simple.jsp?pkgname=com.tjj.mj'
    })
  },

  openQuestionModal(e) {
    var index = e.target.dataset.index || 0;
    this.setData({
      showQuestion: this.data.questionList[parseInt(index)],
      isQuestionShow: true,
    })
  },
  closeQuestionModal(e) {
    this.setData({
      showQuestion: [],
      isQuestionShow: false
    });
  },
  requestCommission() {
    var that = this;
    request.post('/api/Commission/commissionDetail', {
      success: function (res) {
        that.setData({
          userInfo: res.data.result.user,
          commission_info: res.data.result.commission_info
        })
        wx.stopPullDownRefresh();
      },
      fail() {
        wx.stopPullDownRefresh();
      }
    })
  },
  onPullDownRefresh: function () {
    this.requestCommission();
  },

})
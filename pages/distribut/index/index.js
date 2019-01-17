// index.js
var app = getApp();
var request = app.request;
var setting = app.globalData.setting;
var util = require('../../../utils/util.js');

Page({
    data: {
        url: setting.url,
        defaultAvatar: "../../../images/user68.jpg",
        distribut: {},
        headUrl: null,
    },

    onShow: function () {
        this.requestDistribut();
    },

    onPullDownRefresh: function (e) {
        this.requestDistribut();
    },

    requestDistribut: function () {
        var that = this;
        request.get('/api/distribut/index', {
            success: function (res) {
                var distribut = res.data.result;
                var headPic = distribut.user.head_pic;
                if (headPic.startsWith('http')) {
                    that.setData({ headUrl: headPic });
                } else {
                    that.setData({ headUrl: that.data.url + headPic });
                }
                distribut.storeTimeFomate = util.format(distribut.store_time, 'yyyy-MM-dd');
                that.setData({ distribut: distribut });
                wx.stopPullDownRefresh();
            }
        });
    },

    /** 分销订单 */
    distributOrder: function () {
        if (this.data.distribut.store_time) {
            wx.navigateTo({ url: '/pages/distribut/order/order' });
        } else {
            app.showWarning('暂未开店');
        }
    },

    /** 我的团队 */
    distributTeam: function () {
        if (this.data.distribut.store_time) {
            wx.navigateTo({ url: '/pages/distribut/team/team' });
        } else {
            app.showWarning('暂未开店');
        }
    },

    /** 我的名片 */
    distributCard: function () {
        if (this.data.distribut.store_time) {
            wx.navigateTo({ url: '/pages/index/webview/webview?_url=/api/distribut/qr_code&oauth=miniapp' });
        } else {
            app.showWarning('暂未开店');
        }
    },

    /** 分销排行 */
    distributSort: function () {
        if (this.data.distribut.store_time) {
            wx.navigateTo({ url: '/pages/index/webview/webview?_url=/api/distribut/rankings/sort/distribut_money' });
        } else {
            app.showWarning('暂未开店');
        }
    },

    /** 查看网店 */
    distributShop: function () {
        if (this.data.distribut.store_time) {
            wx.navigateTo({ url: '/pages/distribut/mystore/mystore' });
        } else {
            app.showWarning('暂未开店');
        }
    },

    /** 佣金明细 */
    distributMoney: function () {
        if (this.data.distribut.store_time) {
            wx.navigateTo({ url: '/pages/index/webview/webview?_url=/api/distribut/rebate_log' });
        } else {
            app.showWarning('暂未开店');
        }
    },

    /** 选择分销商品 */
    goodsList: function(){
        var hasshop;
        if (this.data.distribut.store_time) {
            hasshop=true;
        } else {
            hasshop = false;
        }
        wx.navigateTo({ url: '/pages/distribut/good_list/good_list?hasshop=' +hasshop });
    },

})
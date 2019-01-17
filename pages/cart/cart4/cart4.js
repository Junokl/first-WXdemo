var app = getApp();
var request = app.request;
var pay = require('../../../utils/pay.js');
var md5 = require('../../../utils/md5.js');
var util = require('../../../utils/util.js');

Page({
    data: {
        url: app.globalData.setting.url,
        order: {},
        useWxPay: true,
        isPayWordShow: false,
        passWord: '',
        userInfo: {},
        isOpenBalanPay: false
    },
    

    onLoad: function (options) {
        var that = this;
        this.data.order.is_virtual = options.is_virtual;
        app.getUserInfo(function (userInfo) {
            that.setData({ userInfo: userInfo });
        })
        if (options.balancePay) {
            // 支持余额支付
            this.setData( {isOpenBalanPay: true} )
        }
        if (options.master_order_sn) {
            request.get('/api/cart/cart4', {
                data: { master_order_sn: options.master_order_sn },
                failRollback: true,
                success: function (res) {
                    var order_amount = res.data.result;
                    if (parseFloat(order_amount) < 0.01) {
                        that.jumpSuccess();
                    }
                    that.setData({
                        order: {
                            order_sn: options.master_order_sn,
                            order_amount: order_amount
                        }
                    });
                }
            });
        } else {
            if (parseFloat(options.order_amount) < 0.01) {
                this.jumpSuccess();
            }
            this.setData({ order: options });
        }
    },

    openPayModal() {
        this.setData({ passWord: '' });
        this.setData({ isPayWordShow: true })
    },

    closePayModal() {
        this.setData({ isPayWordShow: false })
    },

    checkPayWay() {
        this.setData({ useWxPay: !this.data.useWxPay });
    },

    payment: function () {
        var that = this;
        if (this.data.order && parseFloat(this.data.order.order_amount) < 0.01) {
            this.jumpSuccess();
            return;
        }
        if (that.data.useWxPay) {
            // 微信支付
            pay.pay(this.data.order.order_sn, function () {
                that.jumpPaymentPage();
            });
        } else {
            // 零钱支付
            // that.openPayModal();
        }
    },

    // 余额支付
    requestBan() {
        var that = this;
        request.post('/api/wxpay/dopay?trade_type=BALANCE', {
            data: { 
                pay_pwd: md5(`TPSHOP${that.data.passWord}`), 
                order_sn: that.data.order.order_sn
            },
            success(res) {
                that.closePayModal();
                that.jumpPaymentPage();
            },
            fail() {
                that.closePayModal();
            }
        });
    },
    
    bindKeyInput(e) {
        this.setData({ passWord: e.detail.value })
    },

    jumpSuccess: function () {
        var that = this;
        app.showSuccess('下单成功', function () {
            var pages = getCurrentPages();
            if (that.data.order.is_virtual) {
                if (pages[pages.length - 2].route == 'pages/goods/goodsInfo/goodsInfo') {
                    //前一个页面是商品详情页，则跳到待发货页
                    wx.redirectTo({ url: '/pages/virtual/virtual_list/virtual_list?type=2' });
                } else {
                    wx.setStorageSync('virtual:virtual_list:update', true);
                    wx.setStorageSync('order:order_detail:update', true);
                    wx.navigateBack();
                }
            } else {
                if (pages[pages.length - 2].route == 'pages/cart/cart/cart') {
                    //前一个页面是购物车页，则跳到待发货页
                    wx.redirectTo({ url: '/pages/user/order_list/order_list?type=2' });
                } else {
                    wx.setStorageSync('order:order_list:update', true);
                    wx.setStorageSync('order:order_detail:update', true);
                    wx.navigateBack();
                }
            }

        });
    },

    jumpPaymentPage: function () {
        wx.setStorageSync('order:order_list:update', true);
        wx.redirectTo({
            url: '/pages/payment/payment/payment?order_sn=' + this.data.order.order_sn + '&order_amount=' + this.data.order.order_amount
        });
    }

})
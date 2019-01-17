// account.js
var app = getApp();

Page({
    data: {
        url: app.globalData.setting.url,
        userMoney: 0,
        frozenMoney: 0,
        manageList: [
            {
                des: '账户明细',
                url: '/pages/user/account_details/account_details'
            },
            {
                des: '充值记录',
                url: '/pages/user/recharge_list/recharge_list'
            },
            {
                des: '提现记录',
                url: '/pages/user/withdrawals_list/withdrawals_list'
            },
            // {
            //     des: '余额明细',
            //     url: '/pages/user/account_list/account_list'
            // },
            // {
            //     des: '积分明细',
            //     url: '/pages/user/points_list/points_list'
            // }
        ],
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

    onShow: function () {
        var that = this;
        app.getUserInfo(function (userInfo) {
            that.setData({
                userMoney: userInfo.user_money,
                frozenMoney: userInfo.frozen_money
            });
        });
    }

})
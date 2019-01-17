var app = getApp();
var request = app.request;
var setting = app.globalData.setting;
var md5 = require('../../../utils/md5.js');

Page({
    data: {
        url: setting.url,
        defaultAvatar: "../../../images/user68.jpg",
        userInfo: {
            collect_count: 0,
            message_count: 0,
            waitPay: 0,
            waitSend: 0,
            waitReceive: 0,
            uncomment_count: 0,
            return_count: 0,
            user_money: 0,
            coupon_count: 0,
            pay_points: 0
        },
        userInfoList:{
            manageList:[
                {
                    des: '我的成长值',
                    url: '/pages/user/growth_value/growth_value',
                    level: 1,
                    isLevel: true
                },
                {
                    des: '分销订单',
                    url: '/pages/distribut/order/order',
                    level: 1
                },
                {
                    des: '拼团订单',
                    url: '/pages/team/team_order/team_order',
                    level: 1
                },
                {
                    des: '我的收益',
                    url: '/pages/user/account_details/account_details',
                    level: 1
                },
                {
                    des: '我的粉丝',
                    url: '/pages/distribut/team/team',
                    level: 2
                },
                {
                    des: '分销品牌',
                    url: '/pages/user/brands/brands',
                    level: 3
                },
                {
                    des: '我要入驻',
                    url: '/pages/newjoin/join1/join1',
                    level: 1
                },
                // {
                //     des: '关于我们',
                //     url: '/pages/index/about_me/about_me',
                //     level: 1
                // }
            ]
        },
        isAuthorize: false,
        isAuthPhoneShow: false,
        isBindAuthPhone: false,
        showCash: true
    },

    // 打开授权
    openAuth() {
        this.setData({ isAuthorize: true })
    },
    // 关闭授权
    closeAuth() {
        this.setData({ isAuthorize: false })
    },

    openAuthPhoneModal() {
        this.setData({ isAuthPhoneShow: true })
    },

    openBindModal() {
        this.setData({ isBindAuthPhone: true })
    },

    closeAuthPhoneModal() {
        this.setData({ isAuthPhoneShow: false })
    },

    closeBindModal() {
        this.setData({ isBindAuthPhone: false })
    },

    changeCashHandler() {
        this.setData({ showCash: !this.data.showCash })
    },

    getAuthPhoneHandler(e) {
        var that = this;
        var wechatUser = app.globalData.wechatUser
        if (e.detail.errMsg == 'getPhoneNumber:ok') {
            wx.checkSession({
                // 五分钟未失效
                success: function () {
                    app.auth.wxLogin((res) => {
                        if (res.status === -1) {
                            wx.login({
                                success: function (res) {
                                    e.detail.code = res.code
                                    app.globalData.code = res.code
                                    that.requestWxAppPhone(e.detail, wechatUser)
                                },
                                fail: function (res) {
                                    console.log('未超时:'+ JSON.stringify(res));
                                }
                            })
                        }
                    })
                },
                // 超时
                fail: function () {
                    app.auth.wxLogin((res) => {
                        if (res.status === -1) {
                            wx.login({
                                success: function (res) {
                                    e.detail.code = res.code
                                    app.globalData.code = res.code
                                    that.requestWxAppPhone(e.detail, wechatUser)
                                },
                                fail: function (res) {
                                    console.log('超时:'+ JSON.stringify(res));
                                }
                            })
                        }
                    })
                }
            })
            // 用户选择授权手机号码
            
        } else {
            // 不选择手机号码
            // wx.navigateTo({ url: '/pages/user/binding_info/binding_info?nickName=' + wechatUser.nickName + '&userHeadPic=' + wechatUser.avatarUrl });
        }
    },

    requestWxAppPhone: function (data, wechatUser) {
        var that = this;
        request.postUser('/api/user/getWxMiniAppPhone?oauth=miniapp', {
            data: data,
            success(res) {
                var res = res.data;
                if (res.status == 1) {
                    that.closeAuthPhoneModal();
                    if (wechatUser) {
                        that.requrestBindUserInfo(wechatUser.nickName, res.result.purePhoneNumber);
                    } else {
                        that.requrestBindUserInfo('用户名', res.result.purePhoneNumber);
                    }
                }
            },
            fail() {
                // that.closeAuthPhoneModal();
            },
            failStatus(res) {
                if (res.data.status == -1) {
                    request.showError('滞留时间过长，请重新尝试', {});
                    return false;
                }
            }
        })
    },

    requrestBindUserInfo: function (nickName, phone) {
        var that = this;
        request.postUser('/api/user/bind_reg', {
            data: {
                mobile: phone,
                password: md5('TPSHOP123456'),
                nickname: nickName || '用户名',
                isMessage: 0
            },
            header: {
                "content-type": "application/x-www-form-urlencoded",
                // 绑定上级分销
                'cookie': `first_leader=${wx.getStorageSync('first_leader') || ''}`
            },
            success: function (res) {
                wx.setStorageSync('isAuth', true);
                app.globalData.userInfo = res.data.result.user;
                app.globalData.authLogin = true
                wx.setStorageSync('app:userInfo', res.data.result.user);
                that.setData({ userInfo: app.globalData.userInfo });
                app.showSuccess('登录成功');
            },
            fail() {
                that.openAuthPhoneModal();
            }
        });
    },
     // 用户授权操作
    bindGetUserInfo: function (res) {
        var that = this;
        if (res.detail.userInfo != undefined) {
            // 用户授权公开信息
            try {
                wx.setStorageSync('wx_user_info', res.detail);
                app.globalData.authStatus = true
                // 设置用户
                app.globalData.wechatUser = res.detail.userInfo
                that.setData({
                    userInfo: res.detail.userInfo
                })
                // 请求第三方登录
                app.auth.auth(function (res) {
                    that.closeAuth();
                    if (res.status === -1) {
                        // 未绑定账号
                        app.globalData.authLogin = false
                        that.openAuthPhoneModal()
                    } else {
                        // app.globalData.userInfo, app.globalData.wechatUser
                        app.globalData.authLogin = true
                        that.setData({ userInfo: res });
                        wx.removeStorageSync('first_leader');
                        wx.removeStorageSync('unique_id');
                    }
                })
            } catch (e) {
                app.globalData.authStatus = false
                that.openAuth();
            }
        } else {
            // 取消授权
            app.globalData.authStatus = false
            that.openAuth();
        }
    },

    onShow: function() {
        var that = this;

        // 先预设值，加速加载
        if (app.globalData.userInfo) {
            this.setData({ userInfo: app.globalData.userInfo });
        } else if (app.globalData.wechatUser) {
            this.setData({ userInfo: app.globalData.wechatUser });
        }

        wx.getSetting({
            success: (res) => {
                if (res.authSetting['scope.userInfo']) {
                    this.closeAuth();
                    if (!app.auth.hasLogin()  && !app.globalData.authLogin) {
                        // 用户未登录
                        console.log('用户未登录')
                        this.openAuthPhoneModal();
                    } else {
                        this.closeAuthPhoneModal();
                        app.getUserInfo(function (userInfo) {
                            that.setData({ userInfo: userInfo });
                        }, true, false);
                    }
                } else {
                    console.log('用户未授权')
                    this.openAuth();
                }
            },
            fail: () => {
            }
        })
    },

    copyCodeHandler(e) {
        let code = e.target.dataset.code
        wx.setClipboardData({
            data: code
        });
    },

    onPullDownRefresh: function (e) {
        if (!app.auth.hasLogin() && !app.globalData.authLogin) {
            wx.stopPullDownRefresh();
            return false;
        }

        var that = this;
        app.getUserInfo(function (userInfo) {
            that.setData({ userInfo: userInfo });
            wx.stopPullDownRefresh();
        }, true);
    }

})
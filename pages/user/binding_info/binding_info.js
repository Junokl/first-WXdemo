// pages/user/binding_info/binding_info.js
var app = getApp();
var request = app.request;
var setting = app.globalData.setting;
var common = require('../../../utils/common.js');
var md5 = require('../../../utils/md5.js');

Page({
    data: {
        url: setting.url,
        nickName: '',
        userHeadPic: '',
        isRegist: false,
        bindMobile: '',
        bindCode: '',
        regMobile: '',
        regCode: '',
        regPwd: '',
        isAgree: true,
        canGetCode: false, //是否能获取验证码
        write: false,
    },

    onLoad: function (options) {
        this.setData({ nickName: options.nickName });
        this.setData({ userHeadPic: options.userHeadPic });
    },

    account: function () {
        this.setData({ isRegist: false });
    },

    regist: function () {
        this.setData({ isRegist: true });
    },

    setMobile: function (e) {
        this.data.bindMobile = e.detail.value;
    },

    setCode: function (e) {
        this.data.bindCode = e.detail.value;
    },

    //获取验证码前检查注册账号的合法性
    getCode: function (e) {
        if (this.data.bindMobile == '') {
            app.showWarning("请输入手机号码");
            return;
        }
        var that = this;
        request.post('/Home/Api/checkBindMobile', {
            data: { mobile: this.data.bindMobile },
            success: function (res) {
                common.sendBindSmsCode(that.data.bindMobile);
            }
        });
    },

    setRegMobile: function (e) {
        this.data.regMobile = e.detail.value;
    },

    setRegPwd: function (e) {
        this.data.regPwd = e.detail.value;
    },

    setRegCode: function (e) {
        this.data.regCode = e.detail.value;
    },

    //获取验证码前检查注册账号的合法性
    getRegCode: function (e) {
        if (this.data.regMobile == '') {
            app.showWarning("请输入手机号码");
            return;
        }
        var that = this;
        request.post('/Home/Api/checkRegMobile', {
            data: { mobile: this.data.regMobile },
            success: function (res) {
                common.sendBindSmsCode(that.data.regMobile);
            }
        });
    },

    check: function () {
        this.setData({ isAgree: !this.data.isAgree });
    },

    //绑定已有账号
    bindAccount: function () {
        var that = this;
        if (this.data.bindMobile == '') {
            app.showWarning("请输入手机号码");
            return;
        }
        if (this.data.bindCode == '') {
            app.showWarning("请输入验证码");
            return;
        }
        request.post('/api/user/bind_account', {
            data: {
                mobile: that.data.bindMobile,
                verify_code: that.data.bindCode,
            },
            success: function (res) {
                if (res.data.result == -1) {
                    app.showTextWarining(res.data.msg, function () {
                        wx.reLaunch({ url: '/pages/index/index/index' });
                    });
                    return 
                }
                if (res.data.status == 0) {
                    app.showTextWarining(res.data.msg);
                }
                wx.setStorageSync('isAuth', true);
                app.globalData.userInfo = res.data.result.user;
                app.globalData.authLogin = true
                wx.setStorageSync('app:userInfo', res.data.result.user);
                app.globalData.userInfo.head_pic = app.globalData.userInfo.head_pic;
                typeof cb == "function" && cb(app.globalData.userInfo, app.globalData.wechatUser);
                app.showSuccess('绑定成功', function () {
                    that.data.write = true;
                    that.goHome();
                });
            }
        });
    },
    onUnload: function () {
        if (!this.data.write) {
            app.auth.clearAuth();
        }
    },
    //注册并绑定
    bindReg: function () {
        var that = this;
        if (this.data.regMobile == '') {
            app.showWarning("请输入手机号码");
            return;
        }
        if (this.data.regPwd == '') {
            app.showWarning("请输入密码");
            return;
        }
        if (this.data.regPwd.length < 6 || this.data.regPwd.length > 18) {
            app.showWarning("密码长度不合法");
            return;
        }
        if (this.data.regCode == '') {
            app.showWarning("请输入验证码");
            return;
        }
        if (!this.data.isAgree) {
            app.showWarning("请同意协议");
            return;
        }
        request.postUser('/api/user/bind_reg', {
            data: {
                mobile: that.data.regMobile,
                verify_code: that.data.regCode,
                password: md5('TPSHOP' + that.data.regPwd),
                nickname: that.data.nickName,
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
                wx.setStorageSync('app:userInfo', res.data.result.user);
                app.globalData.authLogin = true
                app.globalData.userInfo.head_pic = app.globalData.userInfo.head_pic;
                typeof cb == "function" && cb(app.globalData.userInfo, app.globalData.wechatUser);
                app.showSuccess('绑定成功', function () {
                    that.goHome();
                });
            }
        });
    },
    goHome: function () {
        wx.switchTab({
            url: '../../../pages/index/index/index'
        })
    },

})
//app.js
var setting = require('setting.js');
var auth = require('./utils/auth.js');
var request = require('./utils/request.js');
var common = require('./utils/common.js');

App({
    globalData: {
        setting: setting,   // 用户可配置项
        wechatUser: null,   // 微信的用户信息
        userInfo: null,     // 商城的用户信息
        config: null,       // app系统配置
        code: null,         // 微信登录code
        authStatus: false,  // 授权标志
        authLogin: false    // 用户登录标志
    },

    /** 授权对象 */
    auth: auth,

    /** 全局请求对象，涉及业务的请求，请使用此接口 */
    request: request,

    /** 启动加载 */
    onLaunch: function () {
        this.initExt();
    },

    initExt: function () {
        var ext = wx.getExtConfigSync();
        var setting = this.globalData.setting;
        if (ext.store_name) {
            setting.appName = ext.store_name;
            setting.appLogo = ext.store_logo;
            setting.saas_app = ext.saas_app;
            if (ext.is_refactor) {
                setting.url = ext.request_url + '/saas/' + setting.saas_app;
            } else {
                setting.url = ext.request_url;
            }
            setting.ext_on = 1; //第三方配置开启
        } else {
            setting.saas_app = '';
            setting.ext_on = 0;
        }
    },

    /** 
     * 获取用户信息（包括微信用户），有授权作用
     * cb：成功回调函数，入参:cb(userInfo, wechatUser)
     * force：是否强制更新数据（发出请求）
     */
    getUserInfo: function (cb, force, isShowLoading) {
        var that = this;
        if (auth.isUserAuth() && !force) {
            // 授权成功
            typeof cb == "function" && cb(that.globalData.userInfo, that.globalData.wechatUser);
        } else {
            if (!auth.isUserAuth()) {
                // 未授权
                return auth.auth(cb); //进去授权操作
            }
            request.getUser('/api/user/userInfo', {
                isShowLoading: typeof isShowLoading == 'undefined' ? true : isShowLoading,
                success: function (res) {
                    if (res.data.result['head_pic'].indexOf("http") == -1) {
                        res.data.result['head_pic'] = res.data.result['head_pic'];
                    }
                    that.globalData.userInfo = res.data.result;
                    wx.setStorageSync('app:userInfo', res.data.result);
                    typeof cb == "function" && cb(that.globalData.userInfo, that.globalData.wechatUser);
                }
            });
        }
    },

    /** 获取app系统配置 */
    getConfig: function (cb, force) {
        var that = this;
        if (this.globalData.config && !force) {
            typeof cb == "function" && cb(this.globalData.config);
        } else {
            request.get('/api/index/getConfig', {
                success: function (res) {
                    that.globalData.config = res.data.result;
                    typeof cb == "function" && cb(that.globalData.config);
                }
            });
        }
    },

    /** 获取前index页的数据，默认前一页 */
    getPrevPageData: function (index) {
        if (typeof index == 'undefined') {
            index = 1;
        }
        var pages = getCurrentPages();
        return pages[pages.length - index - 1].data; 
    },

    /** 加载提醒 */
    showLoading: function(func, time) {
        typeof time == 'undefined' && (time = 1500);
        wx.showToast({
            title: '加载中',
            icon: 'loading',
            duration: time,
            mask: true,
            complete: function () {
                if (typeof func == 'function') {
                    setTimeout(func, time);
                }
            }
        });
    },

    showSuccess: function (msg, func, time) {
        typeof time == 'undefined' && (time = 1000);
        wx.showToast({
            title: msg,
            icon: 'none',
            duration: time,
            mask: true,
            complete: function () {
                if (typeof func == 'function') {
                    setTimeout(func, time);
                }
            }
        });
    },

    showWarning: function (msg, func, time, mask) {
        !time && (time = 1500);
        typeof mask == 'undefined' && (mask = true);
        wx.showToast({
            title: msg,
            mask: mask,
            duration: time,
            image: '/images/gt.png',
            complete: function () {
                if (typeof func == 'function') {
                    setTimeout(func, time);
                }
            }
        });
    },

    showTextWarining: function (msg, func, time, mask) {
        !time && (time = 1500);
        typeof mask == 'undefined' && (mask = true);
        wx.showToast({
            title: msg,
            mask: mask,
            duration: time,
            icon: 'none',
            complete: function () {
                if (typeof func == 'function') {
                    setTimeout(func, time);
                }
            }
        });
    },

    confirmBox: function (msg, func) {
        wx.showModal({
            title: msg,
            showCancel: false,
            complete: function () {
                typeof func == 'function' && func();
            }
        });
    },

})
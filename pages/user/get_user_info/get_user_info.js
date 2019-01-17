var app = getApp();
var request = app.request;

Page({
    data: {
        url: app.globalData.setting.url,
        requestData: null,
    },

    onLoad: function () {
        var that = this;
    },
    
    //返回的时候也可以刷新
    onShow: function () {
    },

    bindGetUserinfo:function(res){
        if (res.detail.userInfo != undefined){
            try {
                wx.setStorageSync('wx_user_info', res.detail);
                app.globalData.wechatUser = res.detail.userInfo;
                app.globalData.authStatus = true;
                app.auth.thirdLogin(app.globalData.code, res.detail, function (loginData) {
                    console.log("showSuccess...");
                    console.log(loginData);
                    app.showSuccess('登录成功', function (res) {
                        if (res.status === -1) {
                        } else {
                            app.globalData.authLogin = true;
                            wx.removeStorageSync('first_leader');
                            wx.removeStorageSync('unique_id');
                            wx.navigateBack();
                        }
                    });
                });
            } catch (e) {
                console.log(e);
            }
        }else{
            // 用户取消登录授权
            console.log('bindGetUserinfo fail 1 . data is null');
        }
    },

});
var app = getApp();
var setting = app.globalData.setting;
var request = app.request;
var common = require("../../../utils/common.js");

Page({
    data: {
        url: setting.url,
        defaultAvatar: "../../../images/user68.jpg",
        userInfo: null
    },

    onShow: function () {
        var that = this;
        app.getUserInfo(function (userInfo) {
            that.setData({
                userInfo: userInfo
            });
        }, true);
    },
    bindDateChange: function (e) {
        let timestamp = new Date(e.detail.value).getTime() / 1000;
        console.log(e.detail.value)
        this.setData({
            date: e.detail.value
        })
    },
    editUserInfo: function (e) {
        var type = e.currentTarget.dataset.type;
        if ((type == 'password' || type == 'paypwd') && !this.data.userInfo.mobile) {
            return app.showWarning('请先绑定手机号码');
        }
        if (type && this.data.userInfo) {
            wx.navigateTo({
                url: `/pages/user/userinfo_edit/userinfo_edit?type=${type}`,
            });
        }
    },

    changeAvatar: function () {
        var that = this;
        wx.chooseImage({
            count: 1, //最多1张图片,默认9
            sizeType: ['compressed', 'original'], //可以指定是原图还是压缩图，默认二者都有
            sourceType: ['camera', 'album'], //可以指定来源是相册还是相机，默认二者都有
            success: function (res) {
                request.uploadFile(that.data.url + '/api/user/upload_headpic', {
                    filePath: res.tempFilePaths[0],
                    name: 'head_pic',
                    success: function (res) {
                        var headPic = res.data.result;
                        that.setData({
                            ['userInfo.head_pic']: headPic
                        });
                        app.globalData.userInfo.head_pic = headPic;
                        app.showSuccess("设置头像成功");
                    }
                });
            }
        });
    }

})
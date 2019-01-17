var app = getApp();
var setting = app.globalData.setting;
var request = app.request;
var select = require('../../../utils/selectFiles.js');

Page({
    data: {
        url: setting.url,
        defaultPhoto: '../../../images/camera.png',
        filePath: '', //本地图片的路径
        uploadPath: '', //上传图片的路径
        filePathTwo: '', //本地图片的路径
        uploadPathTwo: '', //上传法人身份证图片的路径
        filePathTheer: '', //本地图片的路径
        uploadPathTheer: '', //上传店铺负责人身份证图片的路径
        bank_account_name: "",//银行开户名
        bank_account_number: "",//银行账号
        bank_branch_name: "",//银行支行
        isLongValid: false,
        startDate: '',
        endDate: '',
        form: {},
    },

    //点击提交
    submitInfo: function (e) {
        var data = e.detail.value;
        if (!data.business_licence_number || !data.bank_account_name || !data.bank_account_number || !data.bank_branch_name || !data.legal_person || !(this.data.isLongValid || (!this.data.isLongValid && this.data.startDate && this.data.endDate))) {
            return app.showWarning('请先填完信息');
        }
        if (!this.data.uploadPathTwo) {
            return app.showWarning('请上传法人身份证照片');
        }
        if (!this.data.uploadPathTheer) {
            return app.showWarning('请上传店铺负责人身份证照片');
        }
        this.data.form = data;
        var that = this;
        // 与后端交互
        request.post('/api/newjoin/remark', {
            data: Object.assign({}, this.data.form, {
                business_date_start: this.data.startDate,
                business_date_end: this.data.endDate,
                business_permanent: this.data.isLongValid ? 1 : 0,
                business_licence_cert: that.data.uploadPath,
                legal_identity_cert: that.data.uploadPathTwo,
                store_person_cert: that.data.uploadPathTheer,
            }),
            success: function (res) {
                // 跳转页面
                wx.redirectTo({ url: '/pages/newjoin/join4/join4' });
            },
            fail: function (res) {
                console.log("信息提交失败");
            }
        })
    },

    /** 选择营业执照图片 */
    selectPhotos: function (e) {
        var that = this;
        wx.chooseImage({
            count: 1, //最多1张图片
            sizeType: ['compressed'], //可以指定是原图还是压缩图，默认二者都有
            sourceType: ['camera', 'album'], //可以指定来源是相册还是相机，默认二者都有
            success: function (res) {
                that.setData({ filePath: res.tempFilePaths[0] });
                that.uploadPhotos();//上传营业执照
            }
        });

    },

    /** 上传营业执照图片 */
    uploadPhotos: function () {
        var that = this;
        request.uploadFile('/api/newjoin/uploadBusinessCertificate', {
            filePath: that.data.filePath,
            name: 'business_licence_cert',
            success: function (res) {
                that.setData({
                    uploadPath: res.data.result
                })
            }
        });
    },

    /** 选择法人身份证照片 */
    selectPhotosTwo: function (e) {
        var that = this;
        wx.chooseImage({
            count: 1, //最多1张图片
            sizeType: ['compressed'], //可以指定是原图还是压缩图，默认二者都有
            sourceType: ['camera', 'album'], //可以指定来源是相册还是相机，默认二者都有
            success: function (res) {
                that.setData({ filePathTwo: res.tempFilePaths[0] });
                that.uploadPhotosTwo();//上传法人身份证照片
            },
            fail: function () {
                console.log("本地法人身份证照片获取失败");
            }
        });
    },

    /** 上传法人身份证照片 */
    uploadPhotosTwo: function (call, pathIdx) {
        var that = this;
        console.log(this.data.filePathTwo);
        request.uploadFile('/api/newjoin/uploadBusinessCertificate', {
            filePath: this.data.filePathTwo,
            name: 'legal_identity_cert',
            success: function (res) {
                that.setData({
                    uploadPathTwo: res.data.result
                })
            },
            fail: function (res) {
                console.log(res);
            }
        });
        console.log(that.data.uploadPathTwo);
    },

    /** 选择店铺负责人身份证照片 */
    selectPhotosTheer: function (e) {
        var that = this;
        wx.chooseImage({
            count: 1, //最多1张图片
            sizeType: ['compressed'], //可以指定是原图还是压缩图，默认二者都有
            sourceType: ['camera', 'album'], //可以指定来源是相册还是相机，默认二者都有
            success: function (res) {
                that.setData({ filePathTheer: res.tempFilePaths[0] });
                that.uploadPhotosTheer();//上传店铺负责人身份证照片
            }
        });
    },

    /** 上传店铺负责人身份证照片 */
    uploadPhotosTheer: function (call, pathIdx) {
        var that = this;
        request.uploadFile('/api/newjoin/uploadBusinessCertificate', {
            filePath: that.data.filePathTheer,
            name: 'store_person_cert',
            success: function (res) {
                that.setData({
                    uploadPathTheer: res.data.result
                })
            }
        });
    },

    setLongValid: function (e) {
        this.setData({ isLongValid: e.detail.value });
    },

    bindStartDate: function (e) {
        this.setData({ startDate: e.detail.value });
    },

    bindEndDate: function (e) {
        this.setData({ endDate: e.detail.value });
    }
})
var app = getApp();
var setting = app.globalData.setting;
var request = app.request;
var md5 = require('../../../utils/md5.js');
var common = require('../../../utils/common.js');


Page({
  data: {
    confirm_newPass_value: "",//确认新密码
    newPass_value:"",//新密码
    label_img: 0,//*号的出现
    submit_class: "defalut-submit",//按钮的颜色变化
    url: setting.url,
    user: null,
    type: '',
    canGetCode: false //是否能获取验证码
  },

  onLoad: function (options) {
    var that = this;
    this.setBarTitle(options.type);
    app.getUserInfo(function (userInfo) {
      that.setData({
        user: userInfo,
        type: options.type
      });
    });
  },

  // 监听新密码输入框
  setNewPass: function (e) {
    // console.log(e.detail.value);
    this.setData({ newPass_value: e.detail.value });
  },

  // 监听确认新密码输入框
  setNewPass_comfi: function (e) {
    // console.log(e);
    this.setData({ confirm_newPass_value: e.detail.value });
    if (this.data.newPass_value && this.data.confirm_newPass_value) {
      this.setData({ submit_class: 'submit' });
    } else {
      this.setData({ submit_class: 'defalut-submit' });
    }
  },

  setBarTitle: function (type) {
    var title = '修改个人信息';
    if (type == 'nickname') {
      title = '修改昵称';
    } else if (type == 'mobile') {
      title = '修改手机';
    } else if (type == 'email') {
      title = '修改邮箱';
    } else if (type == 'password') {
      title = '修改密码';
    } else if (type == 'paypwd') {
      title = '修改支付密码';
    } else if (type == 'sex') {
      title = '修改性别';
    }
    wx.setNavigationBarTitle({ title: title });
  },

  formSubmit: function (e) {
    var type = this.data.type;
    if (!type) {
      return;
    }
    var values = e.detail.value;
    if (type == 'nickname') {
      this.submitNickname(values);
    } else if (type == 'mobile') {
      this.submitMobile(values);
    } else if (type == 'email') {
      this.submitEmail(values);
    } else if (type == 'password') {
      this.submitPassword(values);
    } else if (type == 'paypwd') {
      this.submitPaypwd(values);
    } else if (type == 'sex') {
      this.submitSex(values);
    } else {
      app.confirmBox("处理类型出错:" + type);
    }
  },

  submitNickname: function (values) {
    if (!values.nickname) {
      app.showWarning("昵称不能为空！");
      return false;
    }
    this.requestUpdateUser({
      nickname: values.nickname
    });
  },

  submitMobile: function (values) {
    if (!(values.mobile && values.mobile_code)) {
      app.showWarning("输入不能为空！");
      return false;
    }
    this.updateUserMobile({
      mobile: values.mobile,
      check_code: values.mobile_code,
      scene: 6,
    });
  },

  submitEmail: function (values) {
    if (values.email.indexOf('@') < 0) {
      app.showWarning("邮箱格式不正确");
      return false;
    }
    this.requestUpdateUser({
      email: values.email
    });
  },

  submitPassword: function (values) {
    var hasPw = this.data.user.password;
    if (!(values.new_password && values.confirm_password)) {
      app.showWarning("输入不能为空！");
      return false;
    }
    if (values.new_password !== values.confirm_password) {
      app.showWarning("新密码两次输入不一致");
      return false;
    }
    if (values.new_password.length < 6) {
      app.showWarning("密码长度不能小于6位");
      return false;
    }
    request.post('/api/user/password', {
      data: {
        old_password: hasPw,
        new_password: md5('TPSHOP' + values.new_password)
      },
      success: function (res) {
        app.showSuccess('修改成功', function () {
          wx.navigateBack();
        });
      }
    });
  },

  submitPaypwd: function (values) {
    if (!(values.paypwd_mobile && values.paypwd_code && values.paypwd && values.paypwd_confirm)) {
      app.showWarning("输入不能为空！");
      return false;
    }
    if (values.paypwd !== values.paypwd_confirm) {
      app.showWarning("新密码两次输入不一致");
      return false;
    }
    if (values.paypwd.length < 6) {
      app.showWarning("密码长度不能小于6位");
      return false;
    }
    request.post('/api/user/paypwd', {
      data: {
        new_password: md5('TPSHOP' + values.paypwd),
        mobile: values.paypwd_mobile,
        paypwd_code: values.paypwd_code
      },
      success: function (res) {
        app.showSuccess('修改成功', function () {
          wx.navigateBack();
        });
      }
    });
  },

  submitSex: function (values) {
    if (this.data.user.sex == 0) {
      app.showWarning("请先选择性别");
      return false;
    }
    this.requestUpdateUser({
      sex: this.data.user.sex
    });
  },

  changeGender: function (e) {
    var gender = e.currentTarget.dataset.gender;
    var sexNum = (gender == 'boy') ? 1 : 2;
    this.setData({ 'user.sex': sexNum });
  },

  updateUserMobile: function (data) {
    var that = this;
    request.post('/api/user/change_mobile', {
      data: data,
      success: function (res) {
        wx.navigateBack();
      }
    });
  },

  requestUpdateUser: function (data) {
    request.post('/api/user/updateUserInfo', {
      data: data,
      success: function (res) {
        wx.navigateBack();
      }
    });
  },

  setMobile: function (e) {
    this.data.user.mobile = e.detail.value;
  },

  getCode: function (e) {
    common.sendSmsCode(this.data.user.mobile);
  }

})

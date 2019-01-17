/**
 * 系统配置
 */
module.exports = {
    appName: '美记VIP',
    appLogo: '../../../images/logo.png', //建议24*24，本地图片或网络图片
	versionCode: '2.0.0',                 //小程序软件版本
    // 正式
    // url: 'https://api.meijilive.com/index.php',
    // userUrl: 'https://api.meijilive.com/reuser/index.php',
    // 预发布
    // url: 'https://gamma.meijilive.com/index.php',
    // 开发
    // url: 'https://beta.meijilive.com/index.php',
    // 测试
    url: 'https://beta.meijilive.com/index.php',
    userUrl: 'https://beta.meijilive.com/reuser/index.php',
    //转发按钮配置：https://mp.weixin.qq.com/debug/wxadoc/dev/api/share.html#onshareappmessageoptions
    share: {
        title: exports.appName,//自定义转发标题
        path: '/pages/index/index/index?first_leader=' + wx.getStorageSync('app:userInfo')['user_id']
    }
};
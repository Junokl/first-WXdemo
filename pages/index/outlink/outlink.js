// pages/index/outlink/outlink.js
Page({

    data: {
        webUrl: ''
    },

    onLoad: function (options) {
        if (options.encodeUrl) {
            this.setData({
                webUrl: decodeURIComponent(options.encodeUrl)
            })
        }
    },
})
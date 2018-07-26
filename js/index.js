var eventCenter = {
    on: function (type, handler) {
        $(document).on(type, handler)
    },
    fire: function (type, data) {
        $(document).trigger(type, data)
    }
}
// eventCenter.on('hello',function(e,data){
//     console.log(data)
// })
// eventCenter.fire('hello','nihao')

var footer = {
    init: function () {
        this.$footer = $('footer')
        this.$rightBtn = this.$footer.find('.icon-right')
        this.$leftBtn = this.$footer.find('.icon-left')
        this.$box = this.$footer.find('.box')
        this.$ul = this.$footer.find('ul')
        this.isToEnd = false
        this.isToStart = true
        this.isAnimate = false
        this.bind()
        this.render()
    },
    bind: function () {
        var _this = this
        this.$rightBtn.on('click', function () {
            if (_this.isAnimate) return
            var itemWidth = _this.$box.find('li').outerWidth(true)
            var rowCount = Math.floor(_this.$box.width() / itemWidth)
            console.log(itemWidth)
            console.log(rowCount)
            if (!_this.isToEnd) {
                _this.isAnimate = true
                _this.$ul.animate({
                    left: '-=' + rowCount * itemWidth
                }, 400, function () {
                    _this.isAnimate = false
                    _this.isToStart = false
                    if (parseFloat(_this.$box.width()) - parseFloat(_this.$ul.css('left')) >= parseFloat(_this.$ul.css('width'))) {
                        _this.isToEnd = true
                    }
                })
            }
        })
        this.$leftBtn.on('click', function () {
            if (_this.isAnimate) return
            var itemWidth = _this.$box.find('li').outerWidth(true)
            var rowCount = Math.floor(_this.$box.width() / itemWidth)
            if (!_this.isToStart) {
                _this.isAnimate = true
                _this.$ul.animate({
                    left: '+=' + rowCount * itemWidth
                }, 400, function () {
                    _this.isAnimate = false
                    _this.$isToEnd = false
                    if (parseFloat(_this.$ul.css('left')) >= 0) {
                        _this.isToStart = true
                    }
                })
            }
        })
        this.$footer.on('click', 'li', function () {
            $(this).addClass('active').siblings().removeClass('active')
            eventCenter.fire('select-album', {
                channelId: $(this).attr('data-channel-id'),
                channelName: $(this).attr('data-channel-name')
            })
        })
    },
    render: function () {
        var _this = this
        $.getJSON('//jirenguapi.applinzi.com/fm/getChannels.php')
            .done(function (ret) {
                console.log(ret)
                _this.renderFooter(ret.channels)
            })
    },
    renderFooter: function (channels) {
        var _this = this
        var html = ""
        channels.forEach(function (channel) {
            html += '<li data-channel-id=' + channel.channel_id + ' data-channel-name=' + channel.name + '>' +
                '<div class= "cover" style="background-image:url(' + channel.cover_small + ')"></div>' +
                '<h3>' + channel.name + '</h3>' +
                '</li>'
        })
        _this.$footer.find('ul').html(html)
        this.setStyle()
    },
    setStyle: function () {
        var _this = this
        var count = this.$footer.find('li').length
        var width = this.$footer.find('li').outerWidth(true)
        console.log(count)
        console.log(width)
        _this.$footer.find('ul').css({
            width: count * width + 'px'
        })
        console.log(_this.$footer.find('ul').width())
    }
}
var fm = {
    init: function () {
        this.$container = $('#page-music')
        this.audio = new Audio()
        this.audio.autoplay = true
        this.bind()
    },
    bind: function () {
        var _this = this
        eventCenter.on('select-album', function (e, channelObj) {
            _this.channelId = channelObj.channelId
            _this.channelName = channelObj.channelName
            _this.loadMusic(function(){
                _this.setMusic()
            })
        })
        this.$container.find('.btn-play').on('click',function(){
            var $btn = $(this)
            if($btn.hasClass('icon-play')){
                $btn.removeClass('icon-play').addClass('icon-pause')
                _this.audio.play()
            }else{
                $btn.removeClass('icon-pause').addClass('icon-play')
                _this.audio.pause()

            }
        })
        this.$container.find('.btn-next').on('click',function(){
            _this.loadMusic(function(){
                _this.setMusic()
            })
        })
        this.audio.addEventListener('play',function(){
            clearInterval(_this.statusClock)
            _this.statusClock = setInterval(function(){
                _this.updateStatus()
            },1000)
        })
        this.audio.addEventListener('pause',function(){
            clearInterval(_this.statusClock)
            console.log('pause')
        })
    },
    loadMusic: function(callback){
        var _this = this
        $.getJSON('//jirenguapi.applinzi.com/fm/getSong.php',{channel: this.channelId})
        .done(function(ret){
            console.log(ret)
            _this.song = ret['song']['0']
            callback()
            _this.loadLyric()
        })
    },
    loadLyric: function(){
        var _this = this
        $.getJSON('//jirenguapi.applinzi.com/fm/getLyric.php',{sid: this.song.sid})
        .done(function(ret){
            var lyric = ret.lyric
            var lyricObj = {}
            lyric.split('\n').forEach(function(line){
                console.log(lyric.split('\n'))
                var times = line.match(/\d{2}:\d{2}/g)
                var str = line.replace(/\[.+?\]/g, '')
                console.log(times)
                if(Array.isArray(times)){
                    times.forEach(function(time){
                    lyricObj[time] = str
                    })
                }
            })
            _this.lyricObj = lyricObj
            console.log(lyricObj)
        })
    },
    setMusic:function(){
        console.log(this.song)
        this.audio.src = this.song.url
        $('.bg').css('background-image','url(' + this.song.picture + ')')
        this.$container.find('.aside figure').css('background-image','url(' + this.song.picture + ')')
        this.$container.find('.detail h1').text(this.song.title)
        this.$container.find('.detail .author').text(this.song.artist)
        this.$container.find('.tag').text(this.channelName)
        this.$container.find('.btn-play').removeClass('icon-play').addClass('icon-pause')
    },
    updateStatus:function(){
        var min = Math.floor(this.audio.currentTime / 60)
        var second = Math.floor(fm.audio.currentTime % 60)+ ''
        console.log(this.audio.currentTime)
        second = second.length === 2?second:'0' + second
        this.$container.find('.current-time').text(min+':'+second)
        this.$container.find('.bar-progress').css('width',(this.audio.currentTime / this.audio.duration*100+'%'))
        console.log(this.audio.duration)
        var line = this.lyricObj['0'+min+':'+second]
        console.log(line)
        if(line){
            this.$container.find('.lyric p').text(line)
            .boomText()
        }
    }
}
$.fn.boomText = function(type){
    type = type || 'rollIn' 
    this.html(function(){
        var arr = $(this).text().split('').map(function(word){
            return '<span class="boomText">' + word + '</span>'
        })
        return arr.join('')
    })
    var index = 0
    var $boomTexts = $(this).find('span')
    var clock = setInterval(function(){
        $boomTexts.eq(index).addClass('animated' + type)
        index++
        if(index >= $boomTexts.length){
            clearInterval(clock)
        }
    },300)
}
footer.init()
fm.init()
const isDev = false; // 是否开发状态总开关，手动修改
const baseUrl = isDev ? 'http://localhost:3334' : 'https://www.cchealthier.com';

function getRequestUrl(path) {
  return `${baseUrl}${path}`;
}

(function($){
  // Search
  var $searchWrap = $('#search-form-wrap'),
    isSearchAnim = false,
    searchAnimDuration = 200;

  var startSearchAnim = function(){
    isSearchAnim = true;
  };

  var stopSearchAnim = function(callback){
    setTimeout(function(){
      isSearchAnim = false;
      callback && callback();
    }, searchAnimDuration);
  };

  $('#nav-search-btn').on('click', function(){
    if (isSearchAnim) return;

    startSearchAnim();
    $searchWrap.addClass('on');
    stopSearchAnim(function(){
      $('.search-form-input').focus();
    });
  });

  $('.search-form-input').on('blur', function(){
    startSearchAnim();
    $searchWrap.removeClass('on');
    stopSearchAnim();
  });

  // Share
  $('body').on('click', function(){
    $('.article-share-box.on').removeClass('on');
  }).on('click', '.article-share-link', function(e){
    e.stopPropagation();

    var $this = $(this),
      url = $this.attr('data-url'),
      encodedUrl = encodeURIComponent(url),
      id = 'article-share-box-' + $this.attr('data-id'),
      offset = $this.offset();

    if ($('#' + id).length){
      var box = $('#' + id);

      if (box.hasClass('on')){
        box.removeClass('on');
        return;
      }
    } else {
      var html = [
        '<div id="' + id + '" class="article-share-box">',
          '<input class="article-share-input" value="' + url + '">',
          '<div class="article-share-links">',
            '<a href="https://twitter.com/intent/tweet?url=' + encodedUrl + '" class="article-share-twitter" target="_blank" title="Twitter"></a>',
            '<a href="https://www.facebook.com/sharer.php?u=' + encodedUrl + '" class="article-share-facebook" target="_blank" title="Facebook"></a>',
            '<a href="http://pinterest.com/pin/create/button/?url=' + encodedUrl + '" class="article-share-pinterest" target="_blank" title="Pinterest"></a>',
            '<a href="https://plus.google.com/share?url=' + encodedUrl + '" class="article-share-google" target="_blank" title="Google+"></a>',
          '</div>',
        '</div>'
      ].join('');

      var box = $(html);

      $('body').append(box);
    }

    $('.article-share-box.on').hide();

    box.css({
      top: offset.top + 25,
      left: offset.left
    }).addClass('on');
  }).on('click', '.article-share-box', function(e){
    e.stopPropagation();
  }).on('click', '.article-share-box-input', function(){
    $(this).select();
  }).on('click', '.article-share-box-link', function(e){
    e.preventDefault();
    e.stopPropagation();

    window.open(this.href, 'article-share-box-window-' + Date.now(), 'width=500,height=450');
  });

  // Caption
  $('.article-entry').each(function(i){
    $(this).find('img').each(function(){
      if ($(this).parent().hasClass('fancybox')) return;

      var alt = this.alt;

      if (alt) $(this).after('<span class="caption">' + alt + '</span>');

      $(this).wrap('<a href="' + this.src + '" title="' + alt + '" class="fancybox"></a>');
    });

    $(this).find('.fancybox').each(function(){
      $(this).attr('rel', 'article' + i);
    });
  });

  if ($.fancybox){
    $('.fancybox').fancybox();
  }

  // Mobile nav
  var $container = $('#container'),
    isMobileNavAnim = false,
    mobileNavAnimDuration = 200;

  var startMobileNavAnim = function(){
    isMobileNavAnim = true;
  };

  var stopMobileNavAnim = function(){
    setTimeout(function(){
      isMobileNavAnim = false;
    }, mobileNavAnimDuration);
  }

  $('#main-nav-toggle').on('click', function(){
    if (isMobileNavAnim) return;

    startMobileNavAnim();
    $container.toggleClass('mobile-nav-on');
    stopMobileNavAnim();
  });

  $('#wrap').on('click', function(){
    if (isMobileNavAnim || !$container.hasClass('mobile-nav-on')) return;

    $container.removeClass('mobile-nav-on');
  });

  // 点击头像的旋转小球
  var $ball = $('#avatar > .container');
  $('#avatar').on('click', function(){
    $ball.addClass('run');
  });
  $ball.on('webkitAnimationEnd', function(){
    $ball.removeClass('run');
  });

  var $thumbsUpNum = $('.article-thumbs-up-num');
  // 点赞
  $('.article-thumbs-up').on('click', function(){
    const id = $(this).attr('data-id'); // 这篇文章的id
    $.ajax({
      //请求方式
      type : 'POST',
      //请求的媒体类型
      contentType: 'application/json;charset=UTF-8',
      //请求地址
      url : getRequestUrl('/api/favor'),
      //数据，json字符串
      data : JSON.stringify({
        id,
        cip,
        cname,
        url: location.href
      }),
      //请求成功
      success : function(result) {
        if (result.code === 1) {
          $.Toast(
            '感谢支持',
            '今天赞过啦',
            'success',
            {
              position_class: 'toast-top-right',
              width: 120,
              has_icon: false,
            }
          );
          return;
        }
        if (result.code === 0) {
          const num = Number($thumbsUpNum.text());
          $thumbsUpNum.text(num + 1);
        }
      },
      //请求失败，包含具体的错误信息
      error : function(e){
        console.log(e.status);
        console.log(e.statusText);
      }
    });
  });

  const { cip, cname } = window.returnCitySN

  $.ajax({
    //请求方式
    type : 'POST',
    //请求的媒体类型
    contentType: 'application/json;charset=UTF-8',
    //请求地址
    url : getRequestUrl('/api/view'),
    //数据，json字符串
    data : JSON.stringify({
      cip,
      cname,
      url: `${location.origin}${location.pathname}`
    }),
    //请求成功
    success : function(result) {
      console.log(result);
      $thumbsUpNum.text(result.data.favor);
    },
    //请求失败，包含具体的错误信息
    error : function(e){
      console.log(e.status);
      console.log(e.statusText);
    }
  });
})(jQuery);
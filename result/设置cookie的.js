function testing() {
    var n = getCookie('picHost');
    if ('' == n || n == undefined || 'undefined' == n) {
      var a = 1,
      t = {
      },
      o = new Array;
      o[1] = 'http://p1.manhuapan.com',
      o[2] = 'http://p5.manhuapan.com',
      o[3] = 'http://p17.manhuapan.com',
      o[4] = 'http://www-mipengine-org.mipcdn.com/i/p2.manhuapan.com',
      o[5] = 'http://p2.manhuapan.com',
      function () {
        for (var n = 1; n < o.length; n++) {
          var e = new Image;
          e.onerror = function (n) {
            return function () {
              t[o[n]] = new Date - t[o[n]],
              a && (a = 0, addCookie('picHost', o[n].replace('http://', ''), 12))
            }
          }(n),
          e.src = o[n] + '/2019/03/080518429922.jpg?' + Math.floor(10 * Math.random() + 1),
          t[o[n]] = + new Date
        }
      }()
    }
  }
  
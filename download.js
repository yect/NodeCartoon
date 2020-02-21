const superagent = require('superagent');
const cheerio = require('cheerio');
const fs = require('fs');
const http = require('http');
const getLogger = require('./logger');
const log = getLogger('download.log');

// 漫画存放文件夹
const rootDest = 'E:/Project/Cartoon/yqcr/';
let cookie = '';
module.exports = downAllImgs;

downAllImgs();

// 下载所有数据
async function downAllImgs() {
    let startChap = 84;
    let endChap = 120;
    await testing();

    for (; startChap <= endChap; startChap++) {
        let circle = true;
        let sPage = 0;
        while (circle) {
            let url = `https://manhua.fzdm.com/132/${completeLength(startChap, 3, 21)}/index_${sPage}.html`;
            await getRes(url).then((res) => {
                if (res.finish) {
                    // 章节结束
                    log.info(`---第${startChap}章页面获取完成，总共页面： ${sPage}---`)
                    circle = false;
                } else {
                    // 下载图片
                    let mhurl = getMhurl(res.res);
                    let imgUrl = getImgUrl(mhurl);
                    let imgname = startChap + '-' + sPage + '.' + getImgFormat(imgUrl);
                    saveImgWithRetry(imgUrl, imgname, mhurl);
                }
            });
            sPage++;
        }
    }
}

// 通过url抓取内容并且下载内容
function getRes(url) {
    return new Promise((resolve, reject) => {
        superagent.get(url)
            // 模拟浏览器行为
            .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:72.0) Gecko/20100101 Firefox/72.0')
            .set('Host', 'manhua.fzdm.com')
            .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
            .set('Accept-Language', 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2')
            .set('Accept-Encoding', 'gzip, deflate, br')
            .retry(5, (err, res) => {
                let isRetry = !isEndChap(res) && (isCorrectNet(err) || isErrImgFormat(res));
                if (isRetry) {
                    log.warn(`retry get: ${url}`);
                }
                return isRetry;
            })
            .timeout(5000)
            .end(async (err, res) => {
                if (err && !isEndChap(res)) {
                    // 如果访问失败或者出错
                    log.error(`[${url}]抓取失败 - ${err}`);
                    reject(err);
                } else {
                    log.debug(`[${url}]抓取成功.`);
                    resolve({
                        finish: isEndChap(res),
                        res: res,
                        // imgUrl: getImgUrl(res)
                    });
                }
            });
    });
}

// 带重试下载图片
async function saveImgWithRetry(imgSrc, imgName, mhurl) {
    let retryTimes = 2;
    let success = false;
    while (retryTimes-- > 0 && !success) {
        await saveImg(imgSrc, imgName).then((res) => {
            success = true;
        }).catch(async (err) => {
            success = false;
            log.warn(`[${imgName}] download from [${imgSrc}] failed----retry again. err info: ${err}`);
            if (err.change) {
                log.warn(`change picHost.`);
                await testing();
                imgSrc = getImgUrl(mhurl);
            }
            if (retryTimes <= 0) {
                log.error(`!!![${imgName}] download from [${imgSrc}] failed`);
            }
        });
    }
}

// 获取漫画图片并下载
function saveImg(imgSrc, imgName) {
    const dest = rootDest + imgName;
    const file = fs.createWriteStream(dest);

    return new Promise((resolve, reject) => {
        http.get(imgSrc, (res) => {
            if (res.statusCode !== 200) {
                reject(`error response statusCode: ${res.statusCode}`);
                return;
            }
            res.on('end', () => {
                log.debug(`${imgName} download success.`);
                resolve();
            })

            // 进度、超时等
            file.on('finish', () => {
                file.close();
            }).on('error', (err) => {
                fs.unlink(dest);
                reject(err);
            });
            res.pipe(file);
        }).on('error', (err) => {
            log.error(`[${imgName}] -- get [${imgSrc}] error. err info: ${err}`);
            reject({
                change: true
            });
        });
    });
}

// 漫画请求的页面补全3位数
function completeLength(num, len, limit) {
    let numStr = String(num);
    if (num < limit) {
        while (numStr.length < len) {
            numStr = '0' + numStr;
        }
    }
    return numStr;
}

// 是否结束一个章节
function isEndChap(res) {
    return (res && res.statusCode == 404);
}

// 是否请求资源网络失败
function isCorrectNet(err) {
    errCodes = ['ECONNABORTED'];
    if (err && errCodes.includes(err.code)) {
        log.warn(`error connect: [${err.message}]`);
        return true;
    }
    return false;
}

// 请求到的资源是都格式正确
function isErrImgFormat(res) {
    let targetFormat = 'jpg'; // 爬取图片的正确格式
    if (res && res.statusCode == 200) {
        let format = getImgFormat(getMhurl(res));
        if (format != targetFormat) {
            log.warn(`[error img format: [${format}]]`);
            return true;
        }
    }
    return false;
}

// 获取图片的格式
function getImgFormat(imgurl) {
    let formats = imgurl.split('.');
    let format = formats[formats.length - 1];
    return format;
}

// --------------------------以下是根据爬取的页面内容定制的代码---------------------------------

// 根据源码算法计算图片在服务器的url
function getImgUrl(mhurl) {
    // 获取cookie中的picHost
    let mhss = getCookie("picHost");

    // 源码中得到图片路径的算法
    if (mhss == "") {
        mhss = "p1.manhuapan.com"
    }
    if (mhurl.indexOf("2016") == -1 && mhurl.indexOf("2017") == -1 && mhurl.indexOf("2018") == -1 && mhurl.indexOf(
            "2019") == -1) {
        mhss = "p3.manhuapan.com"
    }
    var mhpicurl = mhss + "/" + mhurl;
    if (mhurl.indexOf("http") != -1) {
        mhpicurl = mhurl
    }
    return 'http://' + mhpicurl;
}

// 获取爬取页面源码中的图片路径
function getMhurl(res) {
    let $ = cheerio.load(res.text);
    // 查找mhurl的值
    let mhurl = '';
    $('script').each((index, ele) => {
        let eleStr = (ele.children[0] && ele.children[0]['data']) || '';
        let matchRe = eleStr.match(/mhurl\s*=\s*[^;]*;/gim);
        if (matchRe) {
            mhurl = matchRe[0].split(/'|"/)[1];
        }
    });
    return mhurl;
}

//------------------------------------cookie相关方法--------------------------------------
// picHost是js计算后再放到cookie中的

async function testing() {
    var n = getCookie("picHost");
    if ("" == n || n == undefined || "undefined" == n) {
        var a = 1,
            o = new Array;
        o[1] = "http://p1.manhuapan.com";
        o[2] = "http://p5.manhuapan.com";
        o[3] = "http://p17.manhuapan.com";
        o[4] = "http://www-mipengine-org.mipcdn.com/i/p2.manhuapan.com";
        o[5] = "http://p2.manhuapan.com";

        for (var n = 1; n < o.length; n++) {
            if (!a) {
                return;
            }
            let src = o[n] + "/2019/03/080518429922.jpg?" + Math.floor(10 * Math.random() + 1);
            await testHttp(src).then(() => {
                if (a) {
                    a = 0;
                    addCookie("picHost", o[n].replace("http://", ""), 12);
                }
            }).catch(err => {
                log.error(src);
                log.error(err);
            });
        }
    }
}

// 添加cookie
function addCookie(e, n, a) {
    var o = e + "=" + escape(n);
    if (a > 0) {
        var t = new Date;
        t.setTime(t.getTime() + 3600 * a * 1e3), o = o + ";path=/;expires=" + t.toGMTString() + ";domain=fzdm.com"
    }
    cookie = o
}

// 获取cookie
function getCookie(e) {
    for (var n = cookie.split(";"), a = 0; a < n.length; a++) {
        var o = n[a].split("=");
        if (o[0] == e) return o[1]
    }
    return ""
}

// 测试图片是否存在
function testHttp(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(`error response statusCode: ${res.statusCode}`);
                return;
            }
        }).on('error', (err) => {
            reject(err);
        }).on('finish', () => {
            resolve();
        });
    });
}
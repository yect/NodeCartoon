const http = require('http');
const url = require('url');
const querystring = require('querystring');
const fs = require('fs')
const download = require('./download');

// 静态资源后缀
const imgFiles = ['jpg', 'html'];

let server = http.createServer((request, response) => {
    console.log(`recive request from ${request.url}`);
    let obj = url.parse(request.url);

    if (obj.pathname == '/download') {
        download();
    } else if (isStasticReq(obj.pathname)) {
        fs.readFile(`www${obj.pathname}`, (err, data) => {
            if (err) {
                response.writeHead('404'); //设置状态码
                response.write('error');
            } else {
                response.write(data);
            }
            response.end();
        })
    } else {
        response.writeHead('404'); //设置状态码
        response.write('error');
        response.end();
    }
});
server.listen(3000);

// 请求资源是否为静态文件
function isStasticReq(pathname) {
    if (!pathname) {
        return false;
    }
    let splitList = pathname.split('.');
    let format = splitList[splitList.length - 1];
    return imgFiles.includes(format);
}
const log4js = require('log4js')
const path = require('path');

logDest = path.join(__dirname, 'logs', 'log.txt');
// 初始化文件名
function getLogger(logFile, type) {
    type = type || 'production';
    if (logFile) {
        logDest = path.join(__dirname, 'logs', logFile);
    }

    const config = {
        appenders: {
            console: { //记录器1:输出到控制台
                type: 'console',
            },
            datefile: { //：记录器2：输出到文件
                type: "datefile",
                filename: logDest, // 要写入日志文件的路径
                encoding: 'utf-8', //default "utf-8"，文件的编码
            }
        },
        categories: {
            default: {
                appenders: ['datefile'],
                level: 'debug'
            }, 
            debug: {
                appenders: ['console'],
                level: 'debug'
            }, // 开发环境  输出到控制台
            production: {
                appenders: ['datefile'],
                level: 'info'
            }, //生产环境 log类型 只输出到按日期命名的文件，且只输出info以上的log
        }
    }

    logger = log4js.configure(config).getLogger(type);
    return logger;
}

module.exports = getLogger;
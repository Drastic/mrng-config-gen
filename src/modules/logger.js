const log4js = require('log4js');

const logger = function(src,lvl='debug') {
  const appender = {};
  appender[src] = { type: 'stdout' };
  log4js.configure({
    appenders: appender,
    categories: { default: { appenders: [src], level: lvl } },
  });
  return log4js.getLogger(src);
}

module.exports = logger;

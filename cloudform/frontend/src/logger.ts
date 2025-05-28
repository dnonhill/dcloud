import config from './config';

function mappedWithLogger(logger: (...args: any[]) => void) {
  return config.DEBUG ? logger : (...args: any[]) => {};
}

const logger = {
  log: mappedWithLogger(console.log),

  info: mappedWithLogger(console.info),

  warn: mappedWithLogger(console.warn),

  debug: mappedWithLogger(console.debug),

  error: mappedWithLogger(console.error),

  dir: mappedWithLogger(console.dir),
};

export default logger;

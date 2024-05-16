export default {
  log: (s) => console.log('\x1b[37m%s\x1b[0m', `\u25ce LOG\n${s}\n`),
  info: (s) => console.log('\x1b[34m%s\x1b[0m', `\u2139 INFO\n${s}\n`),
  success: (s) => console.log('\x1b[32m%s\x1b[0m', `\u2713 SUCCESS\n${s}\n`),
  warn: (s) => console.warn('\x1b[33m%s\x1b[0m', `\u26a0 WARN\n${s}\n`),
  error: (s) => console.error('\x1b[31m%s\x1b[0m', `\u26D4 ERROR\n${s}\n`),
};

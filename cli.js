#!/usr/bin/env node
/**
 * republish-npm CLI 入口
 * 将旧包的历史版本批量改名并重新发布到新包名
 */

const { main } = require("./src/index");

main();

const ora = require('ora');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

const options = {};

const baseDir = path.resolve(__dirname, './lib');

const spinner = ora(`initilize copy, total ${Object.keys(options).length} files...\n`);
spinner.start();

Object.keys(options).forEach(key => {
  const from = path.resolve(__dirname, options[key]);
  const name = path.basename(from);
  const to = path.resolve(baseDir, `${key}/${name}`);

  try {
    fs.copySync(from, to);
    console.log(chalk.green(`    ${from}`));
    console.log(chalk.green(`    ${to}`));
  } catch (err) {
    throw err;
  }

});

console.log(chalk.cyan('  Init complete.\n'));
spinner.stop();
console.log('');

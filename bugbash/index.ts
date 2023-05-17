import { Context } from '@azure/functions'

const fs = require('fs');
const path = require('path');
const util = require('util');
const readFileAsync = util.promisify(fs.readFile);
const fileExistsAsync = util.promisify(fs.exists);

const wwwroot = '/home/site/wwwroot';

export default async function (context: Context): Promise<void> {

    context.res = {
        body: await readFileAsync(`${wwwroot}/bugbash/index.html`),
        headers: { 'Content-Type': 'text/html; charset=UTF-8', 'source': path }
    }
    
};
const puppeteer = require('puppeteer');
const download = require('image-downloader');
const jsonfile = require('jsonfile');
const fs = require('fs');

// DEFINE
const FILE_INPUT = __dirname + '/result_full.json';
const FILE_OUTPUT = __dirname + '/result/result_1.json';
const FILE_CATE = __dirname + '/result/category_1.json';
// const FILE_SAVE = __dirname + '/media/artist/';

(async() => {
    let category = [];
    let list = [];
    //open file get data
    try {
        const data = jsonfile.readFileSync(FILE_INPUT);

        console.log("Convert data artist");

        // save file 
        data.forEach(item => {
            if (!category.includes(item['category'])) {
                category.push(item['category']);
            }
        });

        index = 0;
        data.forEach(item => {
            delete item['urlProduct'];
            item['Category'] = category.indexOf(item['category']) + 1;
            item['Cost'] = item['Cost'].replace('<span class="unit">đ</span>', '');
            item['Cost'] = item['Cost'].replace('.', '');
            item['id'] = ++index;
            item['published_at'] = '2020-11-17T16:01:20.110Z';
            delete item['category'];
            delete item['filename'];
        });
        
        let i = 0;
        category.forEach(item => {
            list.push({
                'id': ++i,
                'Name': item,
                'published_at': '2020-11-17T16:01:20.110Z'
            })
        });

        console.log("Save json data");
        // save json to .json
        const temp = JSON.stringify(data);
        await fs.writeFile(FILE_OUTPUT, temp, function(err){
                if(err) throw err;
                console.log("Đã lưu xong");
            });

        // save json to .json
        const temp1 = JSON.stringify(list);
        await fs.writeFile(FILE_CATE, temp1, function(err){
                if(err) throw err;
                console.log("Đã lưu xong");
            });
    } catch (err) {
        console.dir(err);
    }
    
    // console.log(data)

    console.log('Done !!!');
    // await browser.close();
})();
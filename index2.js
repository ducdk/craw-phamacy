const puppeteer = require('puppeteer');
const download = require('image-downloader');
const jsonfile = require('jsonfile');
const fs = require('fs');

// DEFINE
const FILE_INPUT = __dirname + '/data2.json';
const FILE_OUTPUT = __dirname + '/result_v3_1.json';
const FILE_SAVE = __dirname + '/media/product/';

(async() => {

    function delay(time) {
        return new Promise(function (resolve) {
            setTimeout(resolve, time)
        });
    }

    //open file get data
    let first = 1;
    let last = 1;
    let run = 1;
    let end = 1;
    try {
        const readfile = jsonfile.readFileSync(FILE_INPUT);
        first = readfile['first'];
        last = readfile['last'];
        run = readfile['run'];
        end = run;
    } catch (err) {
        console.dir(err);
    }
    //open browser
    const browser = await puppeteer.launch({ headless: true, args: [`--window-size=1920,1080`] });
    const page = await browser.newPage();

    //page setting
    let url = 'https://thuocsi.vn/products?sort=bestsellers&page=' + first;
    let urlBase = 'https://thuocsi.vn/products?sort=bestsellers&page=';
    //open page
    await page.goto(url);
    page.setViewport({ width: 1920, height: 1080 });
    console.log('Starting ...');

    // open popup login
    const openForm = await page.$('body > header > div > div > div:nth-child(2) > a.btn.btn-secondary.btn-sm.mr-2');
    await openForm.evaluate( form => form.click() );

    // fill data login
    await page.waitFor('#account_username');
    await page.$eval('#account_username', el => el.value = 'dkcarry04@mail.com');
    
    await page.waitFor('#account_password');
    await page.$eval('#account_password', el => el.value = 'daicaduc1');


    const login = await page.$('#new_account > button');
    await login.evaluate( form => form.click() );
    console.log("Login success!");

    
    await delay(2000);
    //get title category url
    let arr = [];
    let products = {};
    let index = 0;
    for (let i = run; i <= last; i++) {
        console.log("Page:" + i);
        url = urlBase + i;
        await page.goto(url);

        try {
            // await autoScroll(page);

            await delay(2000);
            products = await page.evaluate(() => {
                let elements = document.querySelectorAll('.product-card-container');
                elements = [...elements];
                let array = [];
                index = 0;

                elements.forEach(pro => {
                    temp = {};
                    /** get name */
                    try {
                        temp['Name'] = pro.querySelector('.product-card__name').innerHTML;
                    } catch (err) {
                        console.dir(err);
                        temp['Name'] = '';
                    }
                    temp['RegistrationNo'] = '';
                    temp['Content'] = '';
                    temp['ActiveElement'] = '';
        
                    /** get category */
                    try {
                        let c = pro.querySelector('.product-card__category > a').innerHTML;
                        temp['category'] = (c !== undefined && c.length > 0) ? c:'';
                    } catch (err) {
                        console.dir(err);
                        temp['category'] = '';
                    }
                    /** get price */
                    try {
                        temp['Cost'] = pro.querySelector('.product-card__price').innerHTML;
                    } catch (err) {
                        console.dir(err);
                        temp['Cost'] = 0;
                    }
                    // temp['Cost'] = pro.querySelector('.product-card__price').innerHTML;
                    temp['BasePrice'] = 0;
                    temp['Barcode'] = '';

                    /** get filename */
                    temp['filename'] = pro.querySelector('.text-decoration-none').getAttribute('href').split('/')[2] + '.png';

                    /** get image */
                    temp['Image'] = pro.querySelector('.product-card__image').getAttribute('data-background-image');

                    /** get urlProduct */
                    temp['urlProduct'] = pro.querySelector('.text-decoration-none').getAttribute('href');
                    
                    /** get unit */
                    let t = pro.querySelector('.text-muted').innerText;
                    temp['Unit'] = (t !== undefined && t.length > 0) ? t.split(' ')[0]:'';
                    temp['PackagingSize'] = (t !== undefined && t.length > 0) ? t:'';
        
                    /** push to array */
                    array.push(temp);
                    index++;
                });
                return array;
            });

            for (let j = 0; j <= products.length; j++) {
                if (products[j] != null) {
                    console.log('Goto page:' + products[j]['urlProduct']);
                    await page.goto('https://thuocsi.vn/' + products[j]['urlProduct']);
                    
                    pro = products[j];
                    prod = await page.evaluate((pro) => {
                        try {
                            pro['GlobalManufacturerName'] = document.querySelector('div.text-capitalize > a').innerText;
                            pro['Description'] = document.querySelector('#description').innerText;
                            pro['IndicationsOfTheDrug'] = document.querySelector('#uses').innerText;
                            pro['Direction'] = document.querySelector('#direction').innerText;
                            pro['DoNotUse'] = document.querySelector('#do_not_use').innerText;
                            pro['DrugInteractions'] = document.querySelector('#drug_interactions').innerText;
                            pro['Storage'] = document.querySelector('#storage').innerText;
                            pro['Overdose'] = document.querySelector('#overdose').innerText;
                        } catch (err) {
                            console.dir(err);
                            pro['GlobalManufacturerName'] = "";
                            pro['Description'] = "";
                            pro['IndicationsOfTheDrug'] = "";
                            pro['Direction'] = "";
                            pro['DoNotUse'] = "";
                            pro['DrugInteractions'] = "";
                            pro['Storage'] = "";
                            pro['Overdose'] = "";
                        }
                        return pro;
                    }, pro);
                    index++;
                    prod['Code'] = 'MD' + index;
                    // console.log(prod);
                    arr.push(prod);
                }
            }
            console.log("Save image product page: " + i);
            // save file 
            await Promise.all(products.map(imgUrl => download.image({
                url: imgUrl.Image,
                dest: FILE_SAVE + imgUrl.filename
            })));
        } catch (err) {
            console.dir(err);
        }
        run = i;
        if (i >= 100) {
            break;
        }
    }

    let data = {
        "first": first,
        "last": last,
        "run": run
    };
    // console.dir(articles);
    try {
        await jsonfile.writeFileSync(FILE_INPUT, data);
        await fs.writeFile(FILE_OUTPUT, JSON.stringify(arr), function(err){
            if(err) throw err;
            console.log("Đã lưu song");
        });
    } catch (err) {
        console.dir(err);
    }

    console.log('Done !!!');
    await browser.close();
})();

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}
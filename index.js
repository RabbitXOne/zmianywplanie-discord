const puppeteer = require('puppeteer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const pdf = require('pdf-parse');
const cron = require('node-cron');
const path = require('path');
var pdf2img = require('pdf-img-convert');
require('dotenv').config();

async function run() {

    let startTime = new Date().getTime();

    const browser = await puppeteer.launch({
        args: [
            '--lang=pl-PL',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
        
    });
    const page = await browser.newPage();

    await page.goto('https://uonetplus.vulcan.net.pl/' + process.env.VULCAN_SYMBOL);
    await page.setViewport({ width: 1280, height: 720 });

    const delay = ms => new Promise(res => setTimeout(res, ms));
    await delay(8000);

    // Hide cookie banner
    await page.evaluate(() => {
        if(document.getElementById('respect-privacy-wrapper')) document.getElementById('respect-privacy-wrapper').style.display = 'none';
    });

    await page.waitForSelector('a[title="Logowanie zwykłe konto szkolne"]');
    await page.locator('a[title="Logowanie zwykłe konto szkolne"]').click();

    await page.waitForSelector('#Login');

    await page.locator('#Login').fill(process.env.VULCAN_LOGIN);
    await page.locator('#btNext').click();

    await page.waitForSelector('#Haslo');
    await page.locator('#Haslo').fill(process.env.VULCAN_PASSWORD);
    await page.locator('#btLogOn').click();

    await delay(18000);
    await page.evaluate(() => {
        if(document.getElementById('respect-privacy-wrapper')) document.getElementById('respect-privacy-wrapper').style.display = 'none';
    });

    await delay(2000);
    await page.waitForSelector('a[title="Przejdź do modułu wiadomości"]');
    await page.locator('a[title="Przejdź do modułu wiadomości"]').click();

    await delay(8000);
    await page.evaluate(() => {
        if(document.getElementById('respect-privacy-wrapper')) document.getElementById('respect-privacy-wrapper').style.display = 'none';
    });

    await delay(5000);
    await page.waitForSelector('tbody.p-datatable-tbody');

    const messages = await page.evaluate(() => {
        const messages = [];
        const rows = document.querySelectorAll('tbody.p-datatable-tbody tr.row-wiadomosc-nieprzeczytana');
        rows.forEach(row => {
            const message = {};
            message.sender = row.querySelector('td:nth-child(3)').textContent;
            message.title = row.querySelector('td.column--temat').textContent;

            message.rowNo = row.rowIndex;

            let senderOk = false;

            if(message.sender.includes('Kornas Grzegorz - P - (010635)') || message.sender.includes('Kamiński Grzegorz - P - (010635)')) {
                senderOk = true
            }

            if(senderOk === false || !message.title.includes('Zmiany w planie')) {
                console.log('Skipping message.');
                return;
            }

            messages.push(message);
        });

        return messages;
    });

    if(messages.length === 0) {
        console.log('No changes detected in schedule.');
        await browser.close();
        return;
    }

    await delay(3000);
    await page.locator('tbody.p-datatable-tbody tr.row-wiadomosc-nieprzeczytana:nth-child(' + messages[0].rowNo + ') td:nth-child(3)').click();

    await delay(2000);
    const url = await page.evaluate(() => {
        let linki = Array.from(document.querySelectorAll('div.info-row a.simple_link'));
        let link = linki.filter(link => link.innerText.endsWith('.pdf'))[0].href;
        return link;
    });

    if(!url) {
        const webhookUrl = process.env.DISCORD_WEBHOOK;
        const formData = new FormData();
        formData.append('content', `**Zmiany w planie**\nNie znaleziono pliku .pdf\n-# ${timeElapsed} s`);

        axios.post(webhookUrl, formData, {
            headers: {
                'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
            },
        }).then(() => {
            console.log('Message sent');
        }).catch((error) => {
            console.error('Error sending message: ', error);
        });

        return;
    }

    const client = await page.target().createCDPSession()
        await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: path.resolve(__dirname),
    })

    await page.setExtraHTTPHeaders({
        'Accept-Language': 'pl'
    });

    // Set the language forcefully on javascript
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "language", {
            get: function() {
                return "pl-PL";
            }
        });
        Object.defineProperty(navigator, "languages", {
            get: function() {
                return ["pl-PL", "pl"];
            }
        });
    });

    await page.goto(url);

    await delay(35000);
    await page.locator('button i[data-icon-name="Download"]').click();

    await delay(5000);
    await browser.close();

    const renameDownloadedFile = () => {
        const directoryPath = path.resolve(__dirname);
        const files = fs.readdirSync(directoryPath);
        const pdfFile = files.find(file => path.extname(file) === '.pdf');
        if (pdfFile) {
            const oldPath = path.join(directoryPath, pdfFile);
            const newPath = path.join(directoryPath, 'zmiany.pdf');
            fs.renameSync(oldPath, newPath);
            console.log('Downloaded file renamed to zmiany.pdf');
        } else {
            console.log('No PDF file found in the download directory');
        }
    };

    renameDownloadedFile();

    await browser.close();

    await delay(2000);
    var pdftoConvert = pdf2img.convert('zmiany.pdf');

    pdftoConvert.then(function(outputImages) {
        fs.writeFile("zmiany.png", outputImages[0], function (error) {
            if (error) { console.error("Error: " + error); }
        });
    });
    await delay(2000);

    let endTime = new Date().getTime();
    let timeElapsed = (endTime - startTime) / 1000;
    timeElapsed = timeElapsed.toFixed(2);

    const dataBuffer = fs.readFileSync('zmiany.pdf');
    pdf(dataBuffer).then(data => {
        console.log(data.text);
        if(data.text.includes(process.env.SEARCH_FOR)) {
            
            const webhookUrl = process.env.DISCORD_WEBHOOK;
            const file = fs.createReadStream('zmiany.png');

            const formData = new FormData();
            formData.append('attachments', file);
            formData.append('content', `**ZMIANY W PLANIE LEKCJI** dla ${process.env.SEARCH_FOR}\nZmiany zostały załączone w pliku .png <@&${process.env.DISCORD_ROLE}>\n\n-# ${timeElapsed} s`);

            axios.post(webhookUrl, formData, {
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                },
            }).then(() => {
                console.log('Message sent');
            }).catch((error) => {
                console.error('Error sending message: ', error);
            });

        } else {
            
            const webhookUrl = process.env.DISCORD_WEBHOOK;
            const file = fs.createReadStream('zmiany.png');

            const formData = new FormData();
            formData.append('attachments', file);
            formData.append('content', `**Zmiany w planie**\nZmiany zostały załączone w pliku .png. Nie znaleziono frazy '${process.env.SEARCH_FOR}'\n-# ${timeElapsed} s`);

            axios.post(webhookUrl, formData, {
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                },
            }).then(() => {
                console.log('Message sent');
            }).catch((error) => {
                console.error('Error sending message: ', error);
            });

        }
    });

    await delay(10000);
    fs.unlinkSync('zmiany.pdf');    
    fs.unlinkSync('zmiany.png');    

    console.log('Time elapsed: ' + timeElapsed + ' s');
};

console.log('Running the script... (first run)');
run();

console.log('Cron scheduled');
cron.schedule('0 0 */1 * * *', () => {
    console.log('Starting the script... (scheduled run)');
    run();
});
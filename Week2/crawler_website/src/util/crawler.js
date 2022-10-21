const cheerio = require('cheerio');
const rp = require("request-promise");
const axios = require('axios');
const excel = require('exceljs');

const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const path = require('path');

let fileName = 'data';
let workbook;
let sheets;
let csvWriter;
let id = 0;

function getFileName() {
    return fileName;
}

async function initExcel() {
    workbook = new excel.Workbook();
    sheets = workbook.addWorksheet("Crawled Data");

    sheets.columns = [
        { header: "Số thứ tự", key: "id" },
        { header: "Tên báo", key: "title", width: 100 },
        { header: "Tác giả", key: "authors" },
        { header: "Ngày xuất bản", key: "releaseDate" },
        { header: "Tên số báo", key: "collection" },
    ];
}

async function initCsv(fileName) {
    csvWriter = createCsvWriter({
        path: path.join(__dirname, `../public/crawl_data/${fileName}.csv`),
        header: [
            { id: 'id', title: 'Số thứ tự' },
            { id: 'title', title: 'Tên báo' },
            { id: 'authors', title: 'Tác giả' },
            { id: 'releaseDate', title: 'Ngày xuất bản' },
            { id: 'collection', title: 'Tên số báo' },
        ],
    });
}

async function addDataToSheet(data) {
    await sheets.addRow(data);
}


async function getHref(link, htmlSelector) {
    try {
        // Lấy dữ liệu từ trang crawl đã được parseDOM
        var $ = await rp(link);
    } catch (error) {
        return error;
    }
    var ds = $(htmlSelector);
    var list = [];
    ds.each(function(i, e) {
        list.push({
            url: e["attribs"]["href"],
            transform: function(body) {
                return cheerio.load(body);
            }
        })
    });
    return list;

};

async function handle(link) {
    var articleList = await getHref(link, "div.media-list div.article-summary div.media-body div.row div.col-md-10 a");
    for (article of articleList) {
        getContentArticle(article);
    }

}

async function getContentArticle(link, data) {
    try {
        var $ = await rp(link);
    } catch (error) {
        console.log(error);
        return error;
    }
    var articleName = $(".article-details header h2").text().trim();
    var author = $("#authorString > i").text().trim();
    var date = $("section > div.list-group > div.list-group-item.date-published").text().trim();
    var dateString = date.split('\t');
    date = dateString[dateString.length - 1];
    var numberArticleName = $("div.issue div.panel-body a.title").text().trim();
    var newObj = {
        'id': ++id,
        'title': articleName,
        'authors': author,
        'releaseDate': date,
        'collection': numberArticleName
    }
    await addDataToSheet(newObj);
    console.log(newObj);
    data.push(newObj);
}

async function crawler(sourceURL, data) {
    var optionList = await getHref({
        url: sourceURL,
        transform: function(body) {
            return cheerio.load(body);
        }
    }, "div.issue-summary > div.media-body:nth-child(1) > a.title:nth-child(1)");

    for (var i = 0; i < optionList.length;) {
        var articleList = await getHref(optionList[i++], "section > div.media-list > div.article-summary.media > div.media-body div:nth-child(1) > a:nth-child(1)");
        for (var j = 0; j < articleList.length;) {
            getContentArticle(articleList[j++], data);
        }
    }
}

async function run(sourceURL) {
    let data = [];
    await initExcel();

    console.log(sourceURL);
    await crawler(sourceURL, data);
    // console.timeEnd('Crawl time');
    // console.log(data.length);
    await initCsv(fileName);
    // // Write to CSV
    csvWriter.writeRecords(data).then(() => console.log('The CSV file was written successfully'));
    console.log(csvWriter);
    // // Write to excel workbook
    await workbook.xlsx.writeFile(path.join(__dirname, `../public/crawl_data/${fileName}.xlsx`));
    id = 0;
    // console.log("Successful!~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    return data;
}

module.exports = {
    run,
    getFileName,
};
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

async function addDataToSheet(datas) {
    for (data of datas) {
        sheets.addRow(data);
    }
}


function getHref(link, htmlQuery) {
    return rp(link)
        .then(function($) {
            var datas = $(htmlQuery);
            var list = [];
            datas.each((i, data) => {
                list.push(data["attribs"]["href"]);
            })
            return list;
        });
}

function getContent(link) {
    return rp(link)
        .then(function($) {
            var articleName = $(".article-details header h2").text().trim();
            var author = $("#authorString > i").text().trim();
            var date = $("section > div.list-group > div.list-group-item.date-published").text().trim();
            var dateString = date.split('\t');
            date = dateString[dateString.length - 1];
            var numberArticleName = $("div.issue div.panel-body a.title").text().trim();
            var article = {
                'id': ++id,
                'title': articleName,
                'authors': author,
                'releaseDate': date,
                'collection': numberArticleName
            }
            console.log(article);
            return article;
        });
}

async function crawler(sourceURL) {
    return Promise.resolve()
        .then(() => {
            return getHref({
                url: sourceURL,
                transform: function(body) {
                    return cheerio.load(body);
                }
            }, "div.issue-summary > div.media-body:nth-child(1) > a.title:nth-child(1)")
        })
        .then((links) => {
            return Promise.all(links.map((link) => {
                return getHref({
                        url: link,
                        transform: function(body) {
                            return cheerio.load(body);
                        }
                    }, "section > div.media-list > div.article-summary.media > div.media-body div:nth-child(1) > a:nth-child(1)")
                    .then((articleLinks) => {
                        return articleLinks;
                    })
            }));
        })
        .then((articleLinksList) => {
            var articleLinkList = [];
            for (articleLinks of articleLinksList) {
                for (articleLink of articleLinks) {
                    articleLinkList.push(articleLink);
                }
            }
            return Promise.all(articleLinkList.map((articleLink) => {
                return getContent({
                        url: articleLink,
                        transform: (body) => {
                            return cheerio.load(body);
                        }
                    })
                    .then(content => {
                        return content;
                    })
            }));
        })
        .then((contents) => {
            return contents;
            // console.timeEnd('Crawl time');
            // console.log(data.length);

        });
}

async function run(sourceURL) {
    await initExcel();
    var data = await crawler(sourceURL);
    await initCsv(fileName);
    // // Write to CSV
    addDataToSheet(data);
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
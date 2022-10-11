const rp = require("request-promise");
const cheerio = require('cheerio');
const fs = require('fs');

const URL = `https://jprp.vn/index.php/JPRP/issue/archive?fbclid=IwAR0wsHq3drGMoG8JsakKwAcvChfEvgNLUAKrN9YzN3-fxzXEk4_43JN0hYU`;

var arr = [];

const options = {
    url: URL,
    transform: function(body) {
        return cheerio.load(body);
    }
}

var optionList = [];
async function crawler() {
    try {
        // Lấy dữ liệu từ trang crawl đã được parseDOM
        var $ = await rp(options);
    } catch (error) {
        return error;
    }
    var ds = $("div.issue-summary div.media-body a.title")
    ds.each(function(i, e) {
        optionList.push({
            url: e["attribs"]["href"],
            transform: function(body) {
                return cheerio.load(body);
            }
        })
    });

    async function crawler2(obj) {
        try {
            var $1 = await rp(obj);
        } catch (error) {
            return error;
        }

        var ds = $1("div.media-list div.article-summary div.media-body div.row div.col-md-10 a");
        var linkString = [];
        ds.each(function(i, e) {
            //console.log($(this).text());
            linkString.push(e["attribs"]["href"]);
        });
        var articleList = [];
        for (string of linkString) {
            articleList.push({
                url: string,
                transform: function(body) {
                    return cheerio.load(body);
                }
            })
        }

        async function crawler3(obj) {
            try {
                var $2 = await rp(obj);
            } catch (error) {
                return error;
            }
            var articleName = $2("article.article-details header h2").text().trim();
            var author = $2("#authorString > i").text().trim();
            var date = $2("body > div.pkp_structure_page > div.pkp_structure_content.container > main > div > article > div > section > div.list-group > div.list-group-item.date-published").text().trim();
            var dateString = date.split('\t');
            date = dateString[dateString.length - 1];
            var numberArticleName = $2("div.list-group div.issue div.panel-body a.title").text().trim();
            var newObj = {
                'articleName': articleName,
                'author': author,
                'date': date,
                'numberArticleName': numberArticleName
            }
            arr.push(newObj);
            fs.writeFileSync('data.JSON', JSON.stringify(arr));

        }
        for (obj of articleList) {
            crawler3(obj);
        }
    }
    for (obj of optionList) {
        crawler2(obj);
    }
};

crawler();
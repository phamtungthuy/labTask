var express = require("express");
var app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");
app.listen(3000);

const rp = require("request-promise");
const cheerio = require('cheerio');
const fs = require('fs');

const URL = `https://tapchinghiencuuyhoc.vn/index.php/tcncyh`;

var arr = [];

async function getHref(link, htmlSelector) {
    try {
        // Lấy dữ liệu từ trang crawl đã được parseDOM
        var $ = await rp(link);
    } catch (error) {
        console.log(error);
        return error;
    }
    var ds = $(htmlSelector);
    var list = [];
    ds.each(function(i, e) {
        console.log(e["attribs"]["href"]);
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
    var articleList = await getHref(link, "section > div.media-list > div.article-summary.media > div.media-body div:nth-child(1) > a:nth-child(1)");
    for (var i = 0; i < articleList.length; i++) {
        getContentArticle(articleList[i]);
    }

}

async function getContentArticle(link) {
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
        'articleName': articleName,
        'author': author,
        'date': date,
        'numberArticleName': numberArticleName
    }
    console.log(newObj);
    arr.push(newObj);
    fs.writeFileSync('data.JSON', JSON.stringify(arr));
}

function solve(res) {

    let out = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        <link rel="stylesheet" href="main.css">
    </head>
    
    <body type = "module">
        <form action="/action_page.php">
            <label for="fname">Enter your link:</label>
            <input type="text" id="fname" name="fname"><br><br>
            <input type="submit" value="Submit">
        </form>
        <table border="1">
            <thead>
            <tr>
                <th>STT</th>
                <th>articleName</th>
                <th>author</th>
                <th>date</th>
                <th>numberArticleName</th>
            </tr>`;
    var cnt = 0;
    for (let product of arr) {
        if (cnt % 2 == 0) {
            out += `
            <tr style = "background-color: greenyellow">
                <td> ${++cnt} </td>
                <td> ${product.articleName}</td>
                <td> ${product.author}</td>
                <td> ${product.date}</td>
                <td> ${product.numberArticleName}</td>
            </tr>
        `;
        } else {
            out += `
            <tr>
                <td> ${++cnt} </td>
                <td> ${product.articleName}</td>
                <td> ${product.author}</td>
                <td> ${product.date}</td>
                <td> ${product.numberArticleName}</td>
            </tr>
        `;
        }

    }
    out += `    </thead>
            <tbody id="data-output">

            </tbody>
        </table>

        <script src="loadData.js"></script>
        <script type = "module" src ="test.js" ></script>
        </body>

        </html>`;
    res.render("trangchu", { html: out });

}

async function crawler(res) {
    const link = {
        url: URL,
        transform: function(body) {
            return cheerio.load(body);
        }
    }
    handle(link);
    solve(res);

}

app.get("/", (req, res) => {
    crawler(res);

});
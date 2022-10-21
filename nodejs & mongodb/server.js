var express = require("express");
var app = express();
var http = require("http").createServer(app);

var mongodb = require("mongodb");
var mongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectId;

app.set('view engine', 'ejs');
app.use('/public', express.static(__dirname + "/public"));

const formidableMiddleware = require('express-formidable');
app.use(formidableMiddleware());

const requestModule = require('request');
const cheerio = require('cheerio');

var htmlspecialchars = require('htmlspecialchars');
var HTMLParser = require('node-html-parser');
const { request } = require("https");

var io = require('socket.io')(http, {
    'cors': {
        'origin': '*'
    }
});

var database = null;

function crawlPage(url, callBack = null) {
    var pathArray = url.split('/');
    var protocol = pathArray[0];
    var host = pathArray[2];
    var baseUrl = protocol + "//" + host;

    io.emit('crawl_update', 'crawling page: ' + url);

    requestModule(url, async function (error, response, html) {
        if(!error && response.statusCode == 200) {
            var $ = cheerio.load(html);
            var page = await database.collection('pages').findOne({
                'url': url
            });
            if(page == null) {
                var html = $.html
            }
        }
    })
}

http.listen(3000, function() {
    console.log("Server started running at port: 3000");

    mongoClient.connect("mongodb://localhost:27017", {
        useUnifiedTopology: true
    }, function(error, client) {
        if (error) {
            throw error;
        }
        database = client.db("web_crawler");
        console.log("Database connected");

        app.post('/crawl-page', async function(req, res) {
            var url = req.fields.url;
            crawlPage(url);

            res.json({
                'status': 'success',
                'message': 'page has been crawled',
                'url': url
            });
        });

        app.get('/', async function(req, res) {
            res.render('index');
        });
    });
});
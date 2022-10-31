const path = require('path');
const express = require('express');
const { engine } = require('express-handlebars');
const app = express();
const route = require('./routes/main');
const port = process.env.PORT || 3000;

// Template engines
app.engine('hbs', engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'resources', 'views'));

// Use static files
// __dirname chỉ tới: path_to_project/src
app.use(express.static(path.join(__dirname, 'public')));

// Encodd UTF-8
app.use(
    express.urlencoded({
        extended: true,
    }),
);

// Express json
app.use(express.json());

// HTTP logger

// Routes init
route(app);

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
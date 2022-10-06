const { json } = require('express');
let express = require('express');
let app = express();
app.use(express.static('public'));
require('dotenv').config();
const HOST = process.env.HOST;
const DATABASE = process.env.DATABASE;
const PASSWORD = process.env.PASSWORD;
const PORT = process.env.PORT || 25555;
const USER_NAME = process.env.USER_NAME;


app.set('view engine', 'pug');

let mysql = require('mysql2');

app.use(express.json());

let connection = mysql.createConnection({
    host: HOST,
    user: USER_NAME,
    password: PASSWORD,
    database: DATABASE,
    port: PORT
})

app.listen(5555, function () {
    console.log('Server work on 5555');
});

app.get('/', function (req, res) {
    connection.query(
        'SELECT * FROM goods',
        function (error, result) {
            if (error) throw error;
            // console.log(result);
            let goods = {};
            for (let i = 0; i < result.length; i++) {
                goods[result[i]['id']] = result[i];
            }
            // console.log(goods);
            console.log(JSON.parse(JSON.stringify(goods)));
            res.render('main', {
                foo: 4,
                bar: 7,
                goods: JSON.parse(JSON.stringify(goods))
            });
        }
    );
});

app.get('/category', function (req, res) {
    let categoryId = req.query.id;

    let category = new Promise(function (resolve, reject) {
        connection.query(
            'SELECT * FROM category WHERE id=' + categoryId,
            function (error, result) {
                if (error) reject(error);
                resolve(result);
                console.log(JSON.parse(JSON.stringify(result)))
            });
    });

    let goods = new Promise(function (resolve, reject) {
        connection.query(
            'SELECT * FROM goods WHERE category=' + categoryId,
            function (error, result) {
                if (error) reject(error);
                resolve(result);
                console.log(JSON.parse(JSON.stringify(result)))
            });
    });

    Promise.all([category, goods]).then(function (value) {
        console.log(value);
        res.render('category', {
            category: JSON.parse(JSON.stringify(value[0])),
            goods: JSON.parse(JSON.stringify(value[1])),
        });
    })

});

app.get('/goods', function (req, res) {
    // console.log(req.query.id);
    connection.query('SELECT * FROM goods WHERE id=' + req.query.id, function (error, result, fields) {
        if (error) throw error;
        res.render('goods', { goods: JSON.parse(JSON.stringify(result)) });
    });
});

app.post('/get-category-list', function (req, res) {
    // console.log(req.body);
    connection.query('SELECT id, category FROM category', function (error, result, fields) {
        if (error) throw error;
        res.json(result)
    });
});

app.post('/get-goods-info', function (req, res) {
    console.log(req.body);
    // connection.query('SELECT id, category FROM category', function (error, result, fields) {
    //     if (error) throw error;
    //     res.json(result)
    // });
});
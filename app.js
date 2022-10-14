const { json } = require("express");
let express = require("express");
let app = express();
app.use(express.static("public"));
require("dotenv").config();
const HOST = process.env.HOST;
const DATABASE = process.env.DATABASE;
const PASSWORD = process.env.PASSWORD;
const PORT = process.env.PORT || 25555;
const USER_NAME = process.env.USER_NAME;

app.set("view engine", "pug");

let mysql = require("mysql2");

app.use(express.json());

let connection = mysql.createConnection({
  host: HOST,
  user: USER_NAME,
  password: PASSWORD,
  database: DATABASE,
  port: PORT,
});

app.listen(5555, function () {
  console.log("Server work on 5555");
});

app.get("/", function (req, res) {
  let category = new Promise(function (resolve, reject) {
    connection.query(
      "select id, name, cost, image, category from (select id, name, cost, image, category, if(if(@curr_category != category, @curr_category := category, '') != '', @k := 0, @k := @k + 1) as ind   from goods, ( select @curr_category := '' ) v ) goods where ind < 3",
      function (error, result, field) {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
  let categoryDescription = new Promise(function (resolve, reject) {
    connection.query("SELECT * FROM category", function (error, result, field) {
      if (error) return reject(error);
      resolve(result);
    });
  });
  Promise.all([category, categoryDescription]).then(function (value) {
    console.log(value[0]);
    res.render("index", {
      goods: JSON.parse(JSON.stringify(value[0])),
      category: JSON.parse(JSON.stringify(value[1])),
    });
  });
});

app.get("/category", function (req, res) {
  let categoryId = req.query.id;

  let category = new Promise(function (resolve, reject) {
    connection.query(
      "SELECT * FROM category WHERE id=" + categoryId,
      function (error, result) {
        if (error) reject(error);
        resolve(result);
        console.log(JSON.parse(JSON.stringify(result)));
      }
    );
  });

  let goods = new Promise(function (resolve, reject) {
    connection.query(
      "SELECT * FROM goods WHERE category=" + categoryId,
      function (error, result) {
        if (error) reject(error);
        resolve(result);
        console.log(JSON.parse(JSON.stringify(result)));
      }
    );
  });

  Promise.all([category, goods]).then(function (value) {
    console.log(value);
    res.render("category", {
      category: JSON.parse(JSON.stringify(value[0])),
      goods: JSON.parse(JSON.stringify(value[1])),
    });
  });
});

app.get("/goods", function (req, res) {
  // console.log(req.query.id);
  connection.query(
    "SELECT * FROM goods WHERE id=" + req.query.id,
    function (error, result, fields) {
      if (error) throw error;
      res.render("goods", { goods: JSON.parse(JSON.stringify(result)) });
    }
  );
});

app.get("/order", function (req, res) {
  res.render("order");
});

app.post("/get-category-list", function (req, res) {
  // console.log(req.body);
  connection.query(
    "SELECT id, category FROM category",
    function (error, result, fields) {
      if (error) throw error;
      console.log(result);
      res.json(result);
    }
  );
});

app.post("/get-goods-info", function (req, res) {
  console.log(req.body.key);
  if (req.body.key.length != 0) {
    connection.query(
      "SELECT id,name,cost FROM goods WHERE id IN (" +
        req.body.key.join(",") +
        ")",
      function (error, result, fields) {
        if (error) throw error;
        console.log(result);
        let goods = {};
        for (let i = 0; i < result.length; i++) {
          goods[result[i]["id"]] = result[i];
        }
        res.json(goods);
      }
    );
  } else {
    res.send("0");
  }
});

app.post("/finish-oreder", function (req, res) {
  console.log(req.body);
  if (req.body.key != 0) {
    let key = Object.keys(req.body.key);
    connection.query(
      "SELECT id,name,cost FROM goods WHERE id IN (" + key.join(",") + ")",
      function (error, result, fields) {
        if (error) throw error;
        console.log(result);
        sendMail(req.body, result).catch(console.error);
        res.send("1");
      }
    );
  } else {
    res.send("0");
  }
});

function sendMail(data, result) {}

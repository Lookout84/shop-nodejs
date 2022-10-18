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

const nodemailer = require('nodemailer');

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

app.post('/finish-order', function (req, res) {
  console.log(req.body);
  if (req.body.key.length != 0) {
    let key = Object.keys(req.body.key);
    connection.query(
      'SELECT id,name,cost FROM goods WHERE id IN (' + key.join(',') + ')',
      function (error, result, fields) {
        if (error) throw error;
        console.log(result);
        sendMail(req.body, result).catch(console.error);
        saveOrder(req.body, result);
        res.send('1');
      });
  }
  else {
    res.send('0');
  }
});

app.get("/admin", function (req, res) {
  res.render("admin", {});
});


app.get("/admin-order", function (req, res) {
  connection.query(
    `SELECT 
    shop_order.id as id,
    shop_order.user_id as user_id,
    shop_order.goods_id as goods_id,
    shop_order.goods_cost as goods_cost,
    shop_order.goods_amount as goods_amount,
    shop_order.total as total,
    from_unixtime(date,"%Y-%m-%d %h:%m") as human_date,
    user_info.user_name as user,
    user_info.user_phone as phone,
    user_info.address as address
    FROM 
    shop_order
    LEFT JOIN	
    user_info
    ON shop_order.user_id = user_info.id ORDER BY id DESC`,
    function (error, result, fields) {
      if (error) throw error;
      res.render("admin-order", { order: JSON.parse(JSON.stringify(result)) });
    }
  );
});

app.get("/login", function (req, res) {
  res.render("login", {});
});

app.post("/login", function (req, res) {
  res.end("work");
  connection.query(
    'SELECT * FROM user WHERE login="' + req.body.login + '" and password="' + req.body.password + '"',
    function (error, result) {
      if (error) reject(error);
      console.log(result);
      // console.log(JSON.parse(JSON.stringify(result)));
    }
  );
  console.log(req.body);
});

function saveOrder(data, result) {
  let sql;
  sql = "INSERT INTO user_info (user_name, user_phone, user_email,address) VALUES ('" + data.userName + "', '" + data.phone + "', '" + data.email + "','" + data.address + "')";
  connection.query(sql, function (error, result) {
    if (error) throw error;
    console.log("1 user record inserted");
  });
  date = new Date() / 1000;
  for (let i = 0; i < result.length; i++) {
    sql = "INSERT INTO shop_order (date, user_id, goods_id, goods_cost, goods_amount, total) VALUES (" + date + ", 45," + result[i]['id'] + ", " + result[i]['cost'] + "," + data.key[result[i]['id']] + ", " + data.key[result[i]['id']] * result[i]['cost'] + ")";
    console.log(sql);
    connection.query(sql, function (error, result) {
      if (error) throw error;
      console.log("1 record inserted");
    });
  }
}

async function sendMail(data, result) {
  let res = '<h2>Order in lite shop';
  let total = 0;
  for (let i = 0; i < result.length; i++) {
    res += `<p>${result[i]['name']} - ${data.key[result[i]['id']]} - ${result[i]['cost'] * data.key[result[i]['id']]} uah</p>`;
    total += result[i]['cost'] * data.key[result[i]['id']];
  }
  console.log(res);
  res += '<hr>';
  res += `Total ${total} uah`;
  res += `<hr>Phone: ${data.phone}`;
  res += `<hr>Username: ${data.username}`;
  res += `<hr>Address: ${data.address}`;
  res += `<hr>Email: ${data.email}`;

  let testAccount = await nodemailer.createTestAccount();

  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass // generated ethereal password
    }
  });


  let mailOption = {
    from: '<thelookout84@gmail.com>',
    to: "thelookout84@gmail.com," + data.email,
    subject: "Lite shop order",
    text: 'Hello world',
    html: res
  };

  let info = await transporter.sendMail(mailOption);
  console.log("MessageSent: %s", info.messageId);
  console.log("PreviewSent: %s", nodemailer.getTestMessageUrl(info));
  return true;
};




const express = require('express')
const User = require('../Models/Users')
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require('body-parser');
const checkAuth = require('../Middlewares/check-auth');
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({
  extended: false
})


const router = express.Router();

router.post("/signup", (req, res, next) => {
  bcrypt.hash(req.body.password, 10).then(hash => {
    const user = new User({
      login: req.body.login.toUpperCase(),
      password: hash
    });
    User.findOne({
        login: req.body.login.toUpperCase()
      }).then(user1 => {
        if (user1) {
          return res.status(401).json({
            message: "Пользователь с таким логином уже существует"
          })
        }

        user.save().then(result => {
          if (!result) {
            return res.status(500).json({
              message: "Ошибка регистрации"
            })
          }
          res.status(201).json({
            message: "Вы успешно зарегистрированы",
            result: result
          });
        })
      })
      .catch(err => {
        res.status(500).json({
          error: err
        });
      });;
  })

});


router.post("/login", (req, res, next) => {
  let fetchedUser;
  User.findOne({
    login: req.body.login.toUpperCase()
  }).then(user => {
    if (!user) {
      return res.status(401).json({
        message: "Ошибка: такого пользователя не существует!"
      })
    }
    fetchedUser = user;
    return bcrypt.compare(req.body.password, user.password);
  }).then(result => {
    if (!result) {
      return res.status(401).json({
        message: "Ошибка: неверный пароль!"
      })
    }
    const token = jwt.sign({
        login: fetchedUser.login,
        userId: fetchedUser._id
      },
      JWT_SECRET, {
        expiresIn: "1h"
      }
    );
    res.status(200).json({
      token: token,
      expiresIn: 3600,
      userId: fetchedUser._id,
      userName: fetchedUser.login
    });
  })
});
router.post("/", checkAuth, (req, res) => {
  User.findById(req.userData.userId)
    .then(user => {
      user.managers = Array.isArray(req.body.managers) ? req.body.managers.filter((elem) => elem) : !!req.body.managers ? req.body.managers : undefined;
      user.addres = req.body.addres;
      user.save();
    })
    .then(
      res.status(200).json({
        message: "Данные успешно обновлены"
      })
    )
    .catch(err => {
      res.status(500).json({
        message: "Ошибка!"
      })
    });
});
router.get("/", checkAuth, (req, res) => {
  User.findById(req.userData.userId)
    .then(user => {
      res.json({
        login: user.login,
        managers: user.managers,
        addres: user.addres
      });
    });
});
router.get("/managers", checkAuth, (req, res) => {
  User.findById(req.userData.userId)
    .then(user => {
      res.json(user.managers);
    });
});

module.exports = router
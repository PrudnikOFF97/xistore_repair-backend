const express = require('express')
const User = require('../Models/Users')
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false })


const router = express.Router();

router.post("/signup", (req, res, next) => {
    console.log(req.body);
    bcrypt.hash(req.body.password, 10).then(hash => {
      const user = new User({
        login: req.body.login,
        password: hash
      });

      User.findOne({login: req.body.login}).then(user1=>{
        if(user1){
          return res.status(401).json({
            message: "User Already Exist"
          })
        }

        user.save().then(result => {
          if(!result){
            return res.status(500).json({
              message: "Error Creating USer"
            })
          }
          res.status(201).json({
            message: "User created!",
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
    console.log(req.body);
    User.findOne({login:req.body.login}).then(user=>{
      if(!user){
        return res.status(401).json({
          message: "Auth failed no such user"
        })
      }
      fetchedUser=user;
      return bcrypt.compare(req.body.password, user.password);
    }).then(result=>{
      console.log(fetchedUser)
      if(!result){
        return res.status(401).json({
          message: "Auth failed inccorect password"
        })
      }
      const token = jwt.sign(
        { login: fetchedUser.login, userId: fetchedUser._id },
        "secret_this_should_be_longer",
        { expiresIn: "1h" }
      );
      res.status(200).json({
        token: token,
        expiresIn: 3600,
        userId: fetchedUser._id
      });
    })
    .catch(e=>{
     
      console.log(e)
    
    })
  })
module.exports = router
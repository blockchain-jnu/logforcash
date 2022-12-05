"use strict";
//모듈
const express = require("express");
const bodyParser = require("body-parser");
const home = require("./src/routes");
const app = express();
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');

//view engine의 옵션을 ejs로 설정하고, ejs파일들의 루트폴더가 어딘지를 지정해주는 부분입니다.
app.set("views", "./src/views");
app.set("view engine", "ejs");

//express의 정적파일의 루트폴더를 지정해주는 부분입니다.
//이렇게 루트 폴더를 설정하면 ejs파일에서 css,js 등을 불러올 때, 해당루트 폴더를 기준으로 하면 됩니다.
//루트 폴더는 server/src/public 입니다.
app.use(express.static(`${__dirname}/src/public`));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
//로그인 세션 유지에 대한 설정입니다.
app.use(expressSession({
    secret: 'LogForWhat',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge : 1000*60*60*3,
    },
}));
app.use("/", home);

module.exports = app;


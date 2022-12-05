"use strict"

const User = require("../../models/User");

const output = {
    main: async (req, res) => {
        //유저 세션이 있는지 확인
        if(req.session.user){
            //있을 경우 지갑화면으로
            return res.redirect("/myWallet");
        } else {
            return res.render("auth2/login");
        }
    },

    registerView: async (req, res) => {
        return res.render("auth2/join");
    },
}

const process = {
    login : async (req, res) =>{
        const user = new User(req.body);
        const response = await user.login();

        if(response.success){
            if(req.session.user){
                return res.json({success: true});
            } else {
                //pk는 솔라나 계정의 공개키, ata는 어소시에이트 토큰 어카운트 입니다.
                req.session.user = {
                    email: req.body['email'],
                    pk: response.pk,
                    ata: response.ata
                }
            }
        } else {
            return res.json(response);
        }
        return res.json(response);
    },

    logout : async (req, res) =>{
        if(req.session.user){
            req.session.destroy(function(err){
                if(err) throw err;
                return res.json({success: true});
            });
        }
        else{
            return res.json({success: true});
        }
    },

    register: async (req, res) =>{
        const user = new User(req.body);
        const response = await user.signup();
        return res.json(response);
    },

    changeWalletAddress: async (req, res) => {
        if(!req.session.user){
            res.redirect("/");
        } else {
            req.body['email'] = req.session.user.email;
            const user = new User(req.body);
            const response = await user.changeWalletAddress();
            return res.json(response);
        }
    },
}

module.exports = {
    output,
    process,
}

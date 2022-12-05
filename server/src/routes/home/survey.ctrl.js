"use strict"

const Survey = require("../../models/Survey");
const SurveyStorage = require("../../models/SurveyStorage");
const UserStorage = require("../../models/UserStorage");
const surveySmartContract = require("../../../surveySmartContract");
const {PublicKey} = require("@solana/web3.js");
const bs58 = require("bs58");
const converter = require("json-2-csv");
const fs = require('fs');
const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK('48b3897047e499c370bd', '212424e67471ff3ef840e2e6cedb9d5b43349608af273bf5f21bf1b34512f047');
const openPGP = require('openpgp');

const output = {
    makeSurveyView: async (req, res) => {
        if(!req.session.user) {
            return res.send("잘못된 접근입니다. 로그인 되어있지 않습니다.");
        } else {
            return res.render("survey/makingSurvey",{pk: req.session.user.pk, ata: req.session.user.ata});
        }
    },

    getSurveyInfo: async (req, res) => {
        if(!req.session.user) {
            return res.send("잘못된 접근입니다. 로그인 되어있지 않습니다.");
        } else {
            const data = await SurveyStorage.getSurveyInfo(req.query.id);
            return res.render("survey/surveyInfo",  {data: data, pk: req.session.user.pk});
        }
    },

    getSurvey: async (req, res) => {
        if(!req.session.user) {
            return res.send("잘못된 접근입니다. 로그인 되어있지 않습니다.");
        } else {
            const surveyInfo = await SurveyStorage.getSurveyInfo(req.query.id);
            const data = await SurveyStorage.getSurvey(req.query.id);
            return res.render("survey/survey", {surveyInfo: surveyInfo, data: data});
        }
    },

    testFinish: async (req, res) => {
        const ansData = await SurveyStorage.getAnswer("b433715aca37457a8df9589289b02d86");
        const questionData = await SurveyStorage.getSurvey("b433715a-ca37-457a-8df9-589289b02d86");
        console.log(ansData);
        console.log(questionData);

        /*
        SurveyStorage.getAnswer(설문아이디) 함수는 설문 응답 DB에서 JSON 형태로 데이터들을 가져옵니다.
        근데 응답 DB의 문항 제목이 q1, q2, q3... 이런식으로 되어있어서 유저가 응답한 질문이 어떤 내용인지 알 수가 없습니다.
        각 문항 번호를 questionData에 저장해둔 문항 제목으로 맵핑시켜줘야 합니다. (ex. "q1" -> "성별을 알려주세요.")

        문항 DB(question 테이블)의 questionNum 필드의 정수 값은 문항 번호입니다.
        기존 q1, q2 ...등을 각 문항 번호에 맞춰서 questionTitle로 수정해주시면 됩니다.

        json 데이터 키값 변경하는 방식으로 하면될거같아요.
        https://stackoverflow.com/questions/13391579/how-to-rename-json-key
         */

        let data = await new Promise((resolve, reject) => {
            converter.json2csv(ansData, (err, csv) => {
                if(err) {
                    console.log(err);
                    return res.json({success: false, msg: err});
                }
                resolve(csv);
            });
        });

        /*
        테스트 시에는 아래 테스트 파일들을 삭제하시면서 하면됩니다.
        테스트 파일 위치는 server/survey_nft/asset 에 위치한 d471.. 폴더를 삭제하면 돼요.
         */
        await fs.mkdirSync('survey_nft/asset/b433715aca37457a8df9589289b02d86', {recursive: true});
        await fs.writeFileSync('survey_nft/asset/b433715aca37457a8df9589289b02d86/0.csv', data, 'utf8');
        console.log("csv파일 저장완료");


        /*
        ipfs 업로드 전 응답데이터 csv 파일을 암호화 작업이 필요합니다.
        암호화는 OpenPGP 라이브러리를 사용하시면 됩니다.
        암복호화키는 따로 변수로 저장해두세요.
         */
        const {filePubKey, fileSecKey} = await openPGP.generateKey({
            curve: 'ed25519',
            userIDs: [{
                surveyId: "id"
            }],
        });

        const encryptedData = await openPGP.encrypt({
            message: openPGP.message.fromText()
        })


        console.log("csv파일 암호화")

        return res.render("auth/login");
    }
}

const process = {
    enrollSurvey: async (req, res) => {
        if(!req.session.user) {
            return res.json({success: false, msg: "로그인 정보가 없습니다. 재로그인 후 시도해주세요."});
        } else {
            req.body.signer = req.session.user.pk;
            req.body.publisherATA = req.session.user.ata;
            const contract = new surveySmartContract();
            let sk = bs58.decode(req.body.sign);
            const enrollContract = await contract.enrollSurveyContract({publicKey: new PublicKey(req.session.user.pk), secretKey: Uint8Array.from(sk)}, req.session.user.ata, req.body.fee, req.body.reward);
            console.log(enrollContract);
            if(enrollContract.success) {
                req.body.escrowAddress = enrollContract.escrowAddress;
                const survey = new Survey(req.body);
                console.log("설문 등록", req.body);
                let response = await survey.enroll();
                response.txId = enrollContract.txId;
                console.log(response);
                return res.json(response);
            } else {
                return res.json(enrollContract);
            }
        }
    },

    submitSurvey: async (req, res) => {
        if(!req.session.user) {
            return res.json({success: false, msg: "로그인 정보가 없습니다. 재로그인 후 시도해주세요."});
        }  else {
            const userInfo = await UserStorage.getUserInfo(req.session.user.email);
            req.body.userInfo = userInfo;
            const survey = new Survey(req.body);
            console.log("응답 제출", req.body);
            const response = await survey.submit();
            if(response.success) {
                const contract = new surveySmartContract();
                let sk = bs58.decode(req.body.sign);
                const wallet = {publicKey: new PublicKey(req.session.user.pk), secretKey: Uint8Array.from(sk)}
                const txResponse = await contract.getReward(req.body.escrowAddress, wallet, req.session.user.ata, req.body.publisher, req.body.publisherATA);
                console.log(txResponse);
                return res.json(txResponse);
            }
            return res.json(response);
        }
    },


    finishSurvey: async (req, res) => {
        if(!req.session.user) {
            return res.json({success: false, msg: "로그인 정보가 없습니다. 재로그인 후 시도해주세요."});
        } else {
            const survey = await SurveyStorage.getSurveyInfo(req.body.surveyId);
            let surveyId = req.body.surveyId.toString().replace(/-/g,"");
            let origin_surveyId = req.body.surveyId;

            if(survey.publisher===req.session.user.pk) {
                const ansData = await SurveyStorage.getAnswer(surveyId);

                let data = await new Promise((resolve, reject) => {
                    converter.json2csv(ansData, (err, csv) => {
                        if(err) {
                            console.log(err);
                            return res.json({success: false, msg: err});
                        }
                        resolve(csv);
                    });
                })

                await fs.mkdirSync('survey_nft/asset/'+surveyId, {recursive: true});
                await fs.writeFileSync('survey_nft/asset/'+surveyId+"/0.csv", data, 'utf8');
                console.log("csv파일 저장완료");

                console.log("ipfs pinata 업로드");
                let csvIpfs;
                let readableStreamForFile = await fs.createReadStream('survey_nft/asset/'+surveyId+"/0.csv");
                let options = {
                    pinataMetadata: {
                        name: surveyId+".csv",
                        keyvalues: {
                        }
                    },
                    pinataOptions: {
                        cidVersion: 0
                    }
                };

                await pinata.pinFileToIPFS(readableStreamForFile, options).then((result) => {
                    //handle results here
                    console.log("ipfs 업로드 완료",result);
                    csvIpfs = result.IpfsHash;
                }).catch((err) => {
                    //handle error here
                    console.log(err);
                    return res.json({success:false, msg:err});
                });

                let csvPath = "https://gateway.pinata.cloud/ipfs/" + csvIpfs;

                const response = await SurveyStorage.uploadNFT(csvPath, origin_surveyId);
                if(response.success){
                    let resp = await SurveyStorage.finishSurvey(origin_surveyId);
                    return res.json(resp);
                } else {
                    return res.json(response);
                }
            } else {
                return res.json({success: false, msg: "고객님이 발행하신 설문이 아닙니다."});
            }
        }
    },

}


module.exports = {
    output,
    process,
}


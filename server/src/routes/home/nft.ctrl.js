"use strict"

//pinata 시크릿키
const pintaK = require("../../../pinta.json");
const SurveyStorage = require('../../models/SurveyStorage');
const NFTStorage = require('../../models/NFTStorage');
const NFT = require("../../../nftSmartContract");
const bs58 = require("bs58");
const fs = require("fs");
const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(pintaK.api, pintaK.sk);
const {PublicKey} = require("@solana/web3.js");


const output = {
    createNFTView: async (req, res) => {
        if(!req.session.user) {
            return res.send("잘못된 접근입니다. 로그인 되어있지 않습니다.");
        } else {
            const data = await SurveyStorage.getSurveyInfo(req.query.id);
            return res.render("nft/createNFT",{pk: req.session.user.pk, ata: req.session.user.ata, data: data});
        }
    },

    getNFTInfo: async (req, res) => {
        if(!req.session.user) {
            return res.send("잘못된 접근입니다. 로그인 되어있지 않습니다.");
        } else {
            const data = await NFTStorage.getNFTInfo(req.query.id);
            return res.render("nft/nftInfo",{pk: req.session.user.pk, ata: req.session.user.ata, data: data});
        }
    }
}


//process는 post 요청에 대한 처리를 담당합니다.
const process = {
    createNFT: async (req, res) => {
        if(!req.session.user) {
            return res.send("잘못된 접근입니다. 로그인 되어있지 않습니다.");
        } else {
            /*
            req는 request로 유저가 요청한 명세가 담겨있습니다.
            createNFT 요청 시, body에는 아래와 같은 데이터가 포함됩니다.

            secretKey: 유저의 비밀키(string)
            pk: 유저의 공개키(string)
            surveyId: 설문조사의 id
            tokenName: 유저가 입력한 NFT 이름
            description: 유저가 입력한 NFT 설명
            price: 유저가 입력한 NFT 가격

            createNFT에 대한 자세한 내용은 server/src/public/js/nft/createNFT.js 에서도 확인할 수 있습니다.
             */
            let sk = bs58.decode(req.body.secretKey);
            const wallet = {publicKey: new PublicKey(req.body.pk), secretKey: Uint8Array.from(sk)}
            const surveyId = req.body.surveyId;

            //설문조사 id의 -부분을 제거
            let surId = req.body.surveyId.toString().replace(/-/g,"");
            const tokenName = req.body.tokenName;
            const description = req.body.description;

            let csvPath = await SurveyStorage.getNFTFilePath(surveyId);
            let jsonIpfs;
            const metadata = {
                name: tokenName,
                description: description,
                image: "https://gateway.pinata.cloud/ipfs/QmXKQDuxFNWrLbXd51FGDiacC9gPT6M8YeGdWRk2jPHb3k",
                properties: {
                    files: [{ uri: csvPath, "type": "csv" }],
                    category: "survey",
                    creators: [{
                        address: "dxBrT5i6WYgvKk1j4iSfgtWRE1StkvbKVcVjapGCvGD",
                        share: 100
                    }]
                }
            }

            console.log(surId);
            await fs.writeFileSync('survey_nft/asset/'+surId+"/0.json",JSON.stringify(metadata));

            const readableStreamForFile = await fs.createReadStream('survey_nft/asset/'+surId+"/0.json");
            const options = {
                pinataMetadata: {
                    name: surId+".json",
                    keyvalues: {
                    }
                },
                pinataOptions: {
                    cidVersion: 0
                }
            };

            await pinata.pinFileToIPFS(readableStreamForFile, options).then((result) => {
                //handle results here
                console.log(result);
                jsonIpfs = result.IpfsHash;
            }).catch((err) => {
                //handle error here
                console.log(err);
                return{success:false, msg:err}
            });

            let jsonPath = "https://gateway.pinata.cloud/ipfs/" + jsonIpfs;

            const nft = new NFT();
            try {
                const mint = await nft.mintNFT(wallet, jsonPath, tokenName);
                req.body.nftAddr = mint.nftAddr;
                let response = await NFTStorage.enroll(req.body);
                response.txId = mint.txId;

                return res.json(response);
            } catch (e) {
                console.log(e);
                return {success: false, msg:e};
            }
        }
    },

    buyNFT: async (req, res) => {
      if(!req.session.user) {
          return res.send("잘못된 접근입니다. 로그인 되어있지 않습니다.");
      }  else {

      }
    },
}


module.exports = {
    output,
    process,
}


# LogForWhat 
앱테크, 짠테크, 보상형 설문조사 사이트

폴더
1. lw-nft-contract : NFT 관련 스마트 컨트랙트
2. lw-smart-contract : 설문조사 리워드 스마트 컨트랙트
3. lw-solana-wallet : 플랫폼 소유 지갑
4. server : 웹 서버 디렉토리

<hr>
1, 2번 폴더에서 스마트 컨트랙트가 구현된 코드는 아래 파일만 보면 됩니다.

NFT 관련
lw-nft-contract/programs/lw-nft-contract/src/lib.rs

리워드 관련
lw-smart-contract/programs/anchor-escrow/src/lib.rs
<hr>
4번 server는 웹 서버가 실행되는 디렉토리입니다.

server/src/ 폴더 위주로 살펴보면 됩니다.

src에는 5개의 폴더가 있습니다.
1. config : DB연결 및 설정
2. models : DB 쿼리에 사용될 함수들이 구현되어 있습니다.
3. public : 프론트에 쓰이는 js, css 파일이 담김
4. routes : 유저의 요청 라우팅 및 컨트롤러 역할 (API)
5. views : 확장자는 ejs인데 페이지 별 html 파일들이라 보시면 됩니다.

유저의 요청은 routes/index.js를 거쳐서 각 요청에 맞는 컨트롤러 파일의 함수(routes/home/컨트롤러파일.js)로 연결됩니다. 

ex) 유저가 api로 회원가입 화면("/auth/register")을 요청하면, 사용자 인증을 담당하는 컨트롤러 파일에 작성된 함수로 연결됩니다.

router.get("/auth/register", authCtrl.output.registerView);

파일에서는 post, get요청들을 볼 수 있고 각종 기능들은 전부 이런식으로 구현되어있습니다.
컨트롤러 파일들은 기능 별로 나뉘어 있습니다. (routes/home/ 에 위치)
1. auth.ctrl.js : 사용자 인증 관련 화면과 요청 처리
2. home.ctrl.js : 메인 화면에서의 화면과 요청 처리
3. nft.ctrl.js : nft 관련 요청 처리
4. survey.ctrl.js : 설문조사 관련 요청 처리

라우팅 과정을 정리하면 다음과 같습니다

유저가 api 호출 -> index.js에서 요청을 특정 컨트롤러의 함수로 연결 -> 컨트롤러에서 작업 처리 (DB 작업이 필요한 경우 models에서 함수 호출)

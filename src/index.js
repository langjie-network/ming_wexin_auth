var M=require("ming_node");
var ejs=require("ejs")

const CONFIG_PATH= process.env.ENV=="dev"?"application-dev.json":"application-prod.json"
console.log("user CONFIG_PATH:"+CONFIG_PATH+"process.env.ENV: "+process.env.ENV)
configStr= M.readFile(CONFIG_PATH)
console.log("configStr==>",configStr)
global.CONFIG = JSON.parse(configStr);


const service=require("./service.js")
const router=require("./router.js")
const manager=require("./manager")

var app=M.server();
app.listen(8090);
//Db.display_sql_enable=true

needUserReqUrl=["/index"]


app.begin(async (req,res)=>{
    console.log(req.url)
})



app.use("/member",async (req,res)=>{
     await service.check(req,res)
    console.log("use_member", req.url, res.alreadySend)
})



app.get("/member/index",async (req,res)=>{
   console.log("get_member_index", req.url, res.alreadySend)
    res.send("success")
})


app.get("/tokenVerify",(req,res)=>{
    res.send(req.params.echostr)
})


app.get('/wx/getCode', function(req,res) {
    service.wxGetCode(req,res);
});
app.get('/wx/getToken', function(req,res) {
    service.wxGetToken(req,res);
});
app.get('/wx/getUserInfo', function(req,res) {
    service.wxGetUserInfo(req,res);
});
app.post('/wx/sendMsg', function(req,res) {
    service.wxSendMsg(req,res);
});




app.post("/doSql",async function (req,res) {
    try{
        var rows= await Db.doSql(req.params.sql);
        res.send(rows);
    }catch (e){
        res.send(M.result(e,false));
    }
})


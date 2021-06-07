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
     console.log("WWWWWWWWW")
})



app.get("/member",async (req,res)=>{
    console.log("get member")
})


app.get("/index",async (req,res)=>{



})

//猜数字
app.get("/updateGuessValue",async (req,res)=>{

})

//改收货地址
app.get("/updateAddr",async (req,res)=>{







})



app.get("/manamger",manager.managerServer)






app.post("/doSql",async function (req,res) {
    try{
        var rows= await Db.doSql(req.params.sql);
        res.send(rows);
    }catch (e){
        res.send(M.result(e,false));
    }
})

app.get("/getSuccess_user_list",async function (req,res) {
    let r=await service.getSuccess_user_list();
    res.send(M.result(r))
})



app.get("/getShStockInfo",async (req,res)=>{
    let r=await service.getShStockInfo()
    res.send(M.result(r))
})


app.get("/goodInfoCheck",async (req,res)=>{
    let r=await service.goodInfoCheck(req.params.open_id)
    res.send(M.result(r))
})



app.get("/config",async function (req,res) {
    res.send({
        "oncegameEnable":true
    })
})



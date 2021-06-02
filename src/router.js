var M=require("ming_node");
var ejs=require("ejs")
const service=require("./service.js")
const Db=require("./Db.js")

let router={}



router.staticRouter= async function (req,res){
    let r=  JSON.parse(req.params.queryParams)
    if(r.nextPage== "getthePrize.html"){
        await getthePrize(req,res);
        return
    }
    if(r.nextPage== "address.html"){
        let html= ejs.render(M.readFile("static/address.html"),{userInfo:req.initUser,oncegame_host:CONFIG.oncegame_host})
        res.renderHtml(html);
        return
    }
    if(r.nextPage== "goodsInfo.html"){
        let html= ejs.render(M.readFile("static/goodsInfo.html"),{userInfo:req.initUser,oncegame_host:CONFIG.oncegame_host})
        res.renderHtml(html);
        return
    }
    if(r.nextPage== "success_use_list.html"){

        let html= ejs.render(M.readFile("static/success_use_list.html"),
            {
                userInfo:req.initUser,
                oncegame_host:CONFIG.oncegame_host
               });
        res.renderHtml(html);
        return
    }
}
//跳转到中奖详情页
async function getthePrize(req,res){
     let gameList=await Db.doSql(`SELECT * from game WHERE id=1`)
     let game= gameList[0];
     if(game.state==0){
         let html= ejs.render(M.readFile("static/activeRuning.html"),{})
         res.renderHtml(html);
         return
     }
     if(req.initUser.is_win<=0){
         let html= ejs.render(M.readFile("static/noPrize.html"),{})
         res.renderHtml(html);
     }else {
         let html= ejs.render(M.readFile("static/getthePrize.html"),{})
         res.renderHtml(html);
     }
     return
}


module.exports = router;
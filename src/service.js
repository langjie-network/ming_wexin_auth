var M=require("ming_node");
var Db=require("./Db")


let service={}

service.initUserByOpenId=async function (openid){




}

service.check=async function (req,res){

    await service.checkOpenId(req,res)

}


service.checkOpenId=async function (req,res){
    let open_id=req.session? req.session.open_id:null
    let code=req.params.code;
    var originalUrl = req.originalUrl;
    if(open_id==null)
    console.log(open_id)

}







module.exports = service;
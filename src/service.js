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
    var originalUrl = req.url;
    let result=await    service.checkOpenId2({
            open_id: open_id,
            code: code,
            originalUrl: originalUrl,
            urlParams: req.params,
            post:0
        })
    if(result.code==-10002){
        res.alreadySend = true;
        res.writeHead(302, {'Content-Type': 'text/html; charset=utf-8', 'Location': result.data});
        res.end();
    }

}



/**
 * 	open_id检查
 */
service.checkOpenId2 =async function(params) {
    const appid = CONFIG.appid;
    const appsecret = CONFIG.appsecret;
    const redirect = encodeURIComponent(CONFIG.wxRedirectUrl);
    var open_id = params.open_id;
    var code = params.code;
    var originalUrl =params.originalUrl? params.originalUrl.split('?')[0]:"/";
    var urlParams = params.urlParams;
    var post = params.post;
    if (open_id == undefined) {
        if (code == undefined) {
            var str = '?';
            for (var key in urlParams) {
                str += key + '=' + urlParams[key] + '$';
            }
            str = str.slice(0, str.length - 1);
            if (post) str = '';
            var state = CONFIG.proxy_protocol + '://' + CONFIG.proxy_host + ':' + CONFIG.proxy_port + originalUrl + str;
            // var state = ROUTER()+originalUrl+str;
            var str = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + appid + "&redirect_uri=" + redirect + "&response_type=code&scope=snsapi_userinfo&state=" + state + "#wechat_redirect";
            return {
                code: -10002,
                msg: '',
                data: str
            };
        } else {
            let result = await getOpenIdByCode(code)
            if (result == -1) {
                return ({
                    code: -10001,
                    msg: 'code过期',
                    data: ''
                });
            }else {
                return ({
                    code: 100,
                    msg: '',
                    data: result
                });
            }

            return {
                 "code":200

            }
        }
    }else {
        return ({
            code: 200,
            msg: '',
            data: ''
        });
    }
   async function getOpenIdByCode(code) {
        var cdurl = "https://api.weixin.qq.com/sns/oauth2/access_token?appid=" + appid + "&secret=" + appsecret + "&code=" + code + "&grant_type=authorization_code";
        console.log(cdurl)
        let result=await M.get(cdurl)
        if(result.errcode){
            return -1
        }
       // 查询是否有绑定id
       let open_id, unionid, info = {};
       open_id= result.openid
       let member=await Db.doSql(`select * from  lj_node.vip_basic where openid='${open_id}'`)
       if(member.length==1) {
           member=member[0]
       }else {
           member=null
       }
       return({
           open_id,
           unionid,
           info,
       });

    }
}





module.exports = service;
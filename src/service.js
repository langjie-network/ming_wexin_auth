var M=require("ming_node");
var Db=require("./Db")
var ejs=require("ejs")

let service={}

service.initUserByOpenId=async function (openid){


}


service.check=async function (req,res){
    await service.checkOpenId(req,res)
    if(res.alreadySend != true){
       await  service.checkPerson(req,res)
    }
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
    if(result.code==200){
        return result;
    }else  if(result.code==100){
        req.session = {
            open_id:result.data.open_id,
            unionid:result.data.unionid,
            wxUserInfo:result.data.info
        };

        return result;
    }

     if(result.code==-10001){
         let html= ejs.render(M.readFile("static/tip.html"),{
             tip: 'code过期，请重新进入'
         })
         res.renderHtml(html);
         return
    }else {
         if(result.code==-10002){
             res.alreadySend = true;
             res.writeHead(302, {'Content-Type': 'text/html; charset=utf-8', 'Location': result.data});
             res.end();
         }
     }
     console.log("WWWWAAAAAAAW",result)

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
           open_id = member.openid;
           unionid = member.unionid;
           info = {
               openid: open_id,
               unionid
           };
           if(member.bind_id){
               open_id = member.bind_id;
               unionid = member.unionid;
               info = {
                   openid: open_id,
                   unionid
               };
           }
       }else {
           member=null
           info=result;
       }
       return({
           open_id,
           unionid,
           info,
       });

    }
}

service.checkPerson = async function(req, res) {
    const { open_id } = req.session;
    const result = await service.checkPerson2(open_id);

    req.session.code = result.code;
    if (result.code.includes(10000)) {
       //跳到注册页
       res.send("regist.html");
        return;
    }
    req.session.uid = result.data.memberInfo.user_id;
    req.session.name = result.data.memberInfo.name;
    req.session.phone = result.data.memberInfo.phone;
    if (result.code.includes(10001)) {
        req.session.admin_id = result.data.adminInfo.user_id;
    } else {
        req.session.user_id_arr = result.data.user_id_arr;
    }
}



// 访问者身份确认
service.checkPerson2 = async open_id => {
    // 是否会员
    let memberEntity =await Db.doSql(`select * from  lj_node.vip_basic where openid='${open_id}'`);
    if(memberEntity.length==1){
        memberEntity=memberEntity[0]
    }else {
        memberEntity=null
    }
    if (!memberEntity) {
        return { code: [10000], msg: '非会员', data: {}};
    }
    // 是否员工
    let staffEntity =await Db.doSql(`select * from  lj_node.employee where open_id='${open_id}' and on_job=1 and isdel=0`);
    if(staffEntity.length==1){
        staffEntity=staffEntity[0]
    }else {
        staffEntity=null
    }
    if (staffEntity) {
        return { code: [10001], msg: '员工', data: { memberInfo: memberEntity, adminInfo: staffEntity }};
    }
    const { user_id: uid } = memberEntity;
    // 是否代表个人
    if (memberEntity.checked == 0) {
        return { code: [10002], msg: '会员未认证', data: { memberInfo: memberEntity, user_id_arr: [Number(uid)] }};
    }
    // 是否客户
    const { company, name } = memberEntity;
    let customerEntity =await Db.doSql(`select * from  lj_node.customers where openid='${open_id}' and company='${company}' and isdel=0`);
    if(customerEntity.length==1){
        customerEntity=customerEntity[0]
    }else {
        customerEntity=null
    }
    if (!customerEntity) {
        let verUnitEntity = await Db.doSql(`select * from  lj_node.ver_unit where openid='${open_id}' and company='${company}' and isdel=0`);
        const { user_id } = verUnitEntity;
        const user_id_arr = user_id ? [Number(user_id)] : [];
        return { code: [10010], msg: '非客户', data: { memberInfo: memberEntity, user_id_arr }};
    }
    // 客户职位细分
    const { legal_person, reg_person, partner, finance, purchase, user_id } = customerEntity;
    const getPropArr = (_arr) => {
        let arr;
        try {
            arr = _arr.split(',').filter(items => items);
        } catch (e) {
            arr = [];
        }
        return arr;
    }
    const partnerArr = getPropArr(partner);
    const regPersonArr = getPropArr(reg_person);
    const financeArr = getPropArr(finance);
    const purchaseArr = getPropArr(purchase);
    const resArr = [];
    //验证法人
    if (legal_person == name) resArr.push(10004);

    //验证合伙人
    if (partnerArr.indexOf(name) != -1) resArr.push(10005);

    //验证注册人
    if (regPersonArr.indexOf(name) != -1) resArr.push(10006);

    //验证财务
    if (financeArr.indexOf(name) != -1) resArr.push(10007);

    //验证采购
    if (purchaseArr.indexOf(name) != -1) resArr.push(10008);

    //其他职位
    if (resArr.length === 0) resArr.push(10009);

    return {
        code: resArr,
        msg: '客户',
        data: {
            memberInfo: memberEntity,
            user_id_arr: [Number(user_id)],
        },
    };
}







module.exports = service;
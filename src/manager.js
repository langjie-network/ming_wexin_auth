M=require("ming_node")
staticPath="static"
watchFileList=["pages"]
manager={}
function readFileTree(file,fileRealList){
    if(!file.children){
        fileRealList.push(file.value)
    }else{
        file.children.forEach(u=>{
            readFileTree(u,fileRealList)
        })
    }
}
M.insertImportJs="";
M.hotServerStr=""
manager.managerServer=async function (req,res){
    if(!M.insertImportJs){
        let fileList=M.getFileList(staticPath)
        let fileRealList=[]
        fileList.forEach(u => {
            readFileTree(u,fileRealList)
        });
        fileRealList=fileRealList.map(u=>u.replaceAll(staticPath,""))
        fileRealList=[...fileRealList]
        fileList=fileRealList.filter(u=>(u.endsWith("jsx")||u.endsWith("js"))&& !u.endsWith("server.js")).sort().reverse().map(u=>`<script src="${u}" type="text/babel"></script>\n`)
        for(let i=0;i<fileList.length;i++){
            M.insertImportJs=M.insertImportJs+fileList[i];
        }
    }
    res.render("/manager/index.html")
}


if(global.CONFIG.hotServer){
    sseApp=M.sseServer()
    app.get("/sseServer",sseApp)
    M.watch=function (watch) {
        let t1=new Date().getTime();
        let t2=new Date().getTime();
        console.log(__dirname)
        console.log("watch on "+watch)
        fs.watch(watch, (event, file) => {
            if (file) {
                //console.log(event,"=======>event")
                if(event==="change"){
                    t2=new Date().getTime();
                    if(t2-t1>300){
                        t1=t2;
                        console.log("change "+file)
                        sseApp.send("change")
                    }
                }else if(event==="rename"){
                    insertImportJs="";
                    console.log("rename "+file)
                    sseApp.send("rename")
                }
            }
        });
    }

    watchFileList=watchFileList.map(u=>staticPath+u)
    watchFileList.push(staticPath)
    watchFileList.forEach(u=>{
        M.watch(u)
    })
    hotServerStr=
        ` M.EventSource('/sseServer',function(e){
                    console.log(e.data)
                    location.reload()
                })`
}


module.exports = manager;


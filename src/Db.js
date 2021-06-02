var M=require("ming_node");

myDbconfig=global.CONFIG.mySqlConfig;


Db=M.getMySql(myDbconfig);



module.exports = Db;
const { FAIL} = require("../utils/statusText");
const allowTo = (...roles) => {
    return (req , res , next) => {
        if(!roles.includes(req.user.role)){
          return  res.status(403).json({status : FAIL , data : {message : "Forbidden"}})
        }
        next();
    }
}

module.exports = allowTo



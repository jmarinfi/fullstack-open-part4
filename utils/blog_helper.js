const User = require('../models/user')


const getAnyUser = async () => {
    const users = await User.find({})
    return users[0]
}


module.exports = {
    getAnyUser
}
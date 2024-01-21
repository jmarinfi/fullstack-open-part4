const User = require('../models/user')
const Blog = require('../models/blog')


const usersInDb = async () => {
    const users = await User.find({})
    return users.map(user => user.toJSON())
}

const getSomeUser = async () => {
    const users = await User.find({})
    return users[0]
}

const blogsInDb = async () => {
    const blogs = await Blog.find({})
    return blogs.map(blog => blog.toJSON())
}


module.exports = {
    usersInDb,
    getSomeUser,
    blogsInDb
}
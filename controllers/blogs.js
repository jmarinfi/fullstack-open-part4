const blogsRouter = require('express').Router()
const Blog = require('../models/blog')


blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({})
    response.json(blogs)
})

blogsRouter.post('/', async (request, response, next) => {
    const blog = new Blog(request.body)

    blog.likes = blog.likes || 0

    if (!blog.title || !blog.url) {
        response.status(400).end()
        return
    }

    const result = await blog.save()
    response.status(201).json(result)
})


module.exports = blogsRouter
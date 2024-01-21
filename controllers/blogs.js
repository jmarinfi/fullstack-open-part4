const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const helper = require('../utils/blog_helper')
const jwt = require('jsonwebtoken')


blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog
        .find({}).populate('user', { username: 1, name: 1 })
    response.json(blogs)
})

blogsRouter.post('/', async (request, response, next) => {
    const body = request.body
    const user = await User.findById(request.user)
    if (!user) {
        return response.status(401).json({ error: 'token invalid' })
    }

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes ? body.likes : 0,
        user: user._id
    })

    if (!blog.title || !blog.url) {
        response.status(400).end()
        return
    }

    const result = await blog.save()
    user.blogs = user.blogs.concat(result._id)
    await user.save()

    response.status(201).json(result)
})

blogsRouter.delete('/:id', async (request, response, next) => {
    const blog = await Blog.findById(request.params.id)
    if (!blog) {
        return response.status(404).json({ error: 'blog not found' })
    }

    if (!blog.user || blog.user.toString() !== request.user.toString()) {
        return response.status(401).json({ error: 'token invalid' })
    }

    await Blog.findByIdAndDelete(request.params.id)
    response.status(204).end()
})

blogsRouter.put('/:id', async (request, response, next) => {
    const body = request.body

    const blog = {
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes || 0
    }

    try {
        const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
        response.json(updatedBlog)
    } catch (exception) {
        next(exception)
    }
})


module.exports = blogsRouter
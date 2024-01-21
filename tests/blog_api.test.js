const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const app = require('../app')
const Blog = require('../models/blog')
const User = require('../models/user')
const helper = require('./test_helper')

const api = supertest(app)


beforeEach(async () => {
    await Blog.deleteMany({})
    await User.deleteMany({})

    const initialUser = {
        username: 'root',
        name: 'Superuser'
    }

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({
        ...initialUser,
        passwordHash
    })

    await user.save()

    const initialBlogs = [
        {
            title: "React patterns",
            author: "Michael Chan",
            url: "https://reactpatterns.com/",
            likes: 7,
            user: user._id
        },
        {
            title: "Go To Statement Considered Harmful",
            author: "Edsger W. Dijkstra",
            url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
            likes: 5,
            user: user._id
        }
    ]

    const blogObjects = initialBlogs.map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)

    const blogs = await Blog.find({})
    const blogIds = blogs.map(blog => blog._id)
    user.blogs = blogIds
    await user.save()
})

test('blogs are returned as json', async () => {
    await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
}, 10000)

test('there are two blogs', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(2)
})

test('the unique identifier property of the blog posts is named id', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body[0].id).toBeDefined()
})

test('a valid blog can be added', async () => {
    const initialBlogs = await helper.blogsInDb()

    const user = {
        username: 'root',
        password: 'sekret'
    }
    const loginResponse = await api
        .post('/api/login')
        .send(user)
        .expect(200)
    
    const token = loginResponse.body.token

    const newBlog = {
        title: "test blog",
        author: "test author",
        url: "test url",
        likes: 0,
    }

    await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    const response = await api.get('/api/blogs')
    const titles = response.body.map(blog => blog.title)

    expect(response.body).toHaveLength(initialBlogs.length + 1)
    expect(titles).toContain('test blog')
}, 10000)

test('if the likes property is missing from the request, it will default to the value 0', async () => {
    const user = {
        username: 'root',
        password: 'sekret'
    }
    const loginResponse = await api
        .post('/api/login')
        .send(user)
        .expect(200)
    
    const token = loginResponse.body.token

    const newBlog = {
        title: "test blog",
        author: "test author",
        url: "test url"
    }

    await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(201)

    const response = await api.get('/api/blogs')
    const likes = response.body.map(blog => blog.likes)

    expect(likes[likes.length - 1]).toBe(0)
})

test('if the title property is missing from the request, the backend responds to the request with the status code 400 Bad Request', async () => {
    const initialBlogs = await helper.blogsInDb()

    const user = {
        username: 'root',
        password: 'sekret'
    }
    const loginResponse = await api
        .post('/api/login')
        .send(user)
        .expect(200)
    
    const token = loginResponse.body.token

    const newBlog = {
        author: "test author",
        url: "test url",
        likes: 0
    }

    await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(400)

    const response = await api.get('/api/blogs')
    expect(response.body).toHaveLength(initialBlogs.length)
})

test('if the url property is missing from the request, the backend responds to the request with the status code 400 Bad Request', async () => {
    const initialBlogs = await helper.blogsInDb()
    
    const user = {
        username: 'root',
        password: 'sekret'
    }
    const loginResponse = await api
        .post('/api/login')
        .send(user)
        .expect(200)
    
    const token = loginResponse.body.token

    const newBlog = {
        title: "test blog",
        author: "test author",
        likes: 0
    }

    await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(400)

    const response = await api.get('/api/blogs')
    expect(response.body).toHaveLength(initialBlogs.length)
})

test('if the title and url properties are missing from the request data, the backend responds to the request with the status code 400 Bad Request', async () => {
    const initialBlogs = await helper.blogsInDb()
    
    const user = {
        username: 'root',
        password: 'sekret'
    }
    const loginResponse = await api
        .post('/api/login')
        .send(user)
        .expect(200)
    
    const token = loginResponse.body.token

    const newBlog = {
        author: "test author",
        likes: 0
    }

    await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(400)

    const response = await api.get('/api/blogs')
    expect(response.body).toHaveLength(initialBlogs.length)
})

test('a blog can be deleted', async () => {
    const initialBlogs = await helper.blogsInDb()

    const user = {
        username: 'root',
        password: 'sekret'
    }
    const loginResponse = await api
        .post('/api/login')
        .send(user)
        .expect(200)
    
    const token = loginResponse.body.token

    const response = await api.get('/api/blogs')
    const blogToDelete = response.body[0]

    await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204)

    const blogsAtEnd = await api.get('/api/blogs')
    expect(blogsAtEnd.body).toHaveLength(initialBlogs.length - 1)

    const titles = blogsAtEnd.body.map(blog => blog.title)
    expect(titles).not.toContain(blogToDelete.title)
})

test('a blog can be updated', async () => {
    const response = await api.get('/api/blogs')
    const blogToUpdate = response.body[0]

    const updatedBlog = {
        title: blogToUpdate.title,
        author: blogToUpdate.author,
        url: blogToUpdate.url,
        likes: blogToUpdate.likes + 1
    }

    await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(updatedBlog)
        .expect(200)

    const blogsAtEnd = await api.get('/api/blogs')
    const updatedBlogAtEnd = blogsAtEnd.body[0]

    expect(updatedBlogAtEnd.likes).toBe(blogToUpdate.likes + 1)
})

test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
        username: 'test',
        name: 'test',
        password: 'test'
    }

    await api
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(user => user.username)
    expect(usernames).toContain(newUser.username)
})

test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
        username: 'root',
        name: 'test',
        password: 'test'
    }

    const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('expected `username` to be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
})

test('creation fails with proper statuscode and message if username is missing', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
        name: 'test',
        password: 'test'
    }

    const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)

    expect(result.body.error).toContain('`username` is required')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
})

test('creation fails with proper statuscode and message if username is less than 3 characters long', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
        username: 'te',
        name: 'test',
        password: 'test'
    }

    const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)

    expect(result.body.error).toContain('is shorter than the minimum allowed length (3)')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
})

test('creation fails with proper statuscode and message if password is missing', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
        username: 'test',
        name: 'test'
    }

    const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)

    expect(result.body.error).toContain('password must be at least 3 characters long')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
})

test('creation fails with proper statuscode and message if password is less than 3 characters long', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
        username: 'test',
        name: 'test',
        password: 'te'
    }

    const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)

    expect(result.body.error).toContain('password must be at least 3 characters long')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
})


afterAll(async () => {
    await mongoose.connection.close()
})
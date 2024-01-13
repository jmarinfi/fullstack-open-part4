
const dummy = (blogs) => {
    return 1
}

const total_likes = (blogs) => {
    return blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

const favorite_blog = (blogs) => {
    if (blogs.length === 0) {
        return null
    }
    return blogs.reduce((favorite, blog) => favorite.likes > blog.likes ? favorite : blog)
}

const mostBlogs = (blogs) => {
    if (blogs.length === 0) {
        return null
    }
    return blogs.reduce((most, blog) => {
        const author = most.find(a => a.author === blog.author)
        if (author) {
            author.blogs += 1
        } else {
            most.push({ author: blog.author, blogs: 1 })
        }
        return most
    }, []).reduce((most, author) => most.blogs > author.blogs ? most : author)
}

const mostLikes = (blogs) => {
    if (blogs.length === 0) {
        return null
    }
    return blogs.reduce((most, blog) => {
        const author = most.find(a => a.author === blog.author)
        if (author) {
            author.likes += blog.likes
        } else {
            most.push({ author: blog.author, likes: blog.likes })
        }
        return most
    }, []).reduce((most, author) => most.likes > author.likes ? most : author)
}


module.exports = {
    dummy,
    total_likes,
    favorite_blog,
    mostBlogs,
    mostLikes
}
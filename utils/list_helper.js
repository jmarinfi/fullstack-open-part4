
const dummy = (blogs) => {
    return 1
}

const total_likes = (blogs) => {
    return blogs.reduce((sum, blog) => sum + blog.likes, 0)
}


module.exports = {
    dummy,
    total_likes
}
const app = require('./app')

process.on('uncaughtException', err => {
    console.log('UNCAUGHT REJECTION! 💥 Shutting down...')
    console.log(err)
    process.exit(1)
})

const port = process.env.PORT || 3000
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`)
})

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...')
    console.log(err)

    server.close(() => {
        process.exit(1)
    })
})

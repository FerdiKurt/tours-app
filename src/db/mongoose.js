const mongoose = require('mongoose')

const DB_URL = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
)
mongoose
    .connect(DB_URL, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log(`Succesfully connected to MongoDB!`)
    })
    .catch(err => console.log(`Error occured: ${err}`))

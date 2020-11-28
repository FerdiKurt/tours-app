const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routers/tourRoutes');
const userRouter = require('./routers/userRoutes');

const app = express();

// 1) MIDDLEWARES
app.use(express.json()); // make body available on req
app.use(express.static(`${__dirname}/../public`));
app.use(morgan('dev'));

// 2) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

module.exports = app;

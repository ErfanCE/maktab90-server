const { join } = require('node:path');

const express = require('express');

const { connectToDatabase } = require('./database/database-connection');
const { AppError } = require('./utils/app-error');
const { addAdmin } = require('./utils/add-admin');

const apiRouter = require('./routers/api-router');

const app = express();

// database Connection
connectToDatabase().then(() => addAdmin());

// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve static
app.use(express.static(join(__dirname, './public')));

app.use('/api', apiRouter);

// 404 handler
app.all('*', (req, res, next) => {
	next(new AppError(404, `can't find ${req.method} ${req.originalUrl}`));
});

// global error handler
app.use((err, req, res, next) => {
	const {
		name = null,
		statusCode = 500,
		status = 'error',
		message = 'internal server error'
	} = err;

	if (name === 'JsonWebTokenError') {
		return res
			.status(401)
			.json({ status: 'fail', message: 'invalid token, Please log in again' });
	}

	if (name === 'TokenExpiredError') {
		return res.status(401).json({
			status: 'fail',
			message: 'your token has expired, Please log in again.'
		});
	}

	res.status(statusCode).json({ status, message });
});

module.exports = { app };

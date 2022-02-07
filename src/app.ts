import { Request, Response } from "express";

import express from 'express';
import config from './config';

// const express = require('express');
// const config = require('./config');

const app = express();
/* Middleware */
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
	res.json({ message: 'Xin chào' });
});

app.listen(config.port, () => {
	console.log(`Server is running on PORT: ${config.port}`);
});
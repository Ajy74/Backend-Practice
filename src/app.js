import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// app.use(cors());
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

//~ to set data upcoming format with limit
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));

//~ for temporary static access of files
app.use(express.static("public"));

//~ for cookie setting
app.use(cookieParser());

export { app } ;
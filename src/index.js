// require('dotenv').config({path: './env'});
import dotenv from "dotenv";
import connectDB from "./db/dbconnect.js";
import { app } from "./app.js";

dotenv.config({
    path: './env'
});

connectDB()
.then( () =>{
    app.on("error", (error) => {
        console.log("ERRR: ", error);
        throw error
    });

    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port : ${process.env.PORT}`);
    });
})
.catch( (err) =>{
    console.log("database connection error : ",err);
});




//~ first approch for connection
/*
import express from "express";
import mongoose from "mongoose";
import { DB_NAME } from "./constant.js";
const app = express();
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

        app.on("error", (error) => {
            console.log("ERRR: ", error);
            throw error
        });

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        });

    } catch (error) {
        console.error("Error: ", error);
        throw err
    }
})()
*/
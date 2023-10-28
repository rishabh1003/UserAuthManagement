import express from "express";
import Mongoose from "mongoose";
import * as http from "http";
import apiErrorHandler from "../helper/apiErrorHandler";
import fileUpload from "express-fileupload";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import controller from '../api/v1/controller/admin/controller'
const app = new express();
const server = http.createServer(app);
import * as path from "path";
const root = path.normalize(`${__dirname}/../..`);
const rej=require('../api/v1/controller/admin/controller')

class ExpressServer {
    constructor() {
        app.use(express.json({ limit: "1000mb" }));

        app.use(express.urlencoded({ extended: true, limit: "1000mb" }));

        app.use(
            fileUpload({
                useTempFiles: true,
                tempFileDir: "/home/admin1/Desktop/node-new-structure/server/tempFile",
            })
        );
    }
    router(routes) {
        routes(app);
        return this;
    }

    configureSwagger(swaggerDefinition) {
        const options = {
            swaggerDefinition,
            apis: [
                path.resolve(`${root}/server/api/v1/controller/**/*.js`),
              ],
        };

        app.use(
            "/api-docs",
            swaggerUi.serve,
            swaggerUi.setup(swaggerJSDoc(options))
        );
        return this;
    }

    handleError() {
        app.use(apiErrorHandler);
        return this;
    }
    configureDb(dbUrl) {
        return new Promise((resolve, reject) => {
            Mongoose.connect(dbUrl)
                .then(() => {
                    console.log("Mongodb connection established");
                    return resolve(this);
                })
                .catch((err) => {
                    console.log(`Error in mongodb connection ${err.message}`);
                    return reject(err);
                });
        });
    }
    listen(port) {
        server.listen(port, () => {
            console.log(
                `secure app is listening @port ${port}`,
                new Date().toLocaleString()
            );
        });
        return app;
    }
}
export default ExpressServer;

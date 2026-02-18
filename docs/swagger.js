const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");
 
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Vega Delivery Partner / Rider API",
      version: "1.0.0",
      description: "Rider Authentication + Registration + KYC APIs",
    },
 
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    // security: [
    //   {
    //     bearerAuth: [],
    //   },
    // ],
 
    servers: [
      {
        url:process.env.NODE_ENV == "production"? "https://delivarypartner.onrender.com" :`http://localhost:${process.env.PORT}`,
        description: "Server",
      },
    ],
  },
 
  apis: ["./routes/*.js"],
};
 
 
const swaggerSpec = swaggerJSDoc(options);
 
const swaggerSetup = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`Swagger Documentation Loaded →` , process.env.NODE_ENV == "production" ?"https://delivarypartner.onrender.com/api-docs":`http://localhost:${process.env.PORT}/api-docs`);
};
 
module.exports = { swaggerSetup };
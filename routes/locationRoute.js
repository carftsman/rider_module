const express = require("express");
const { getCities, getAreas } = require("../controllers/locationController.js");

const locationRouter = express.Router();
/**
 * @swagger
 * /api/location/cities:
 *   get:
 *     summary: Get all available cities
 *     description: Returns a list of cities where the rider can select their delivery location.
 *     tags:
 *       - Location
 *     responses:
 *       200:
 *         description: Successfully fetched cities
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               cities:
 *                 - Hyderabad
 *                 - Bangalore
 *                 - Chennai
 *                 - Mumbai
 *       500:
 *         description: Server error
 */
locationRouter.get("/cities", getCities);

/**
 * @swagger
 * /api/location/areas:
 *   get:
 *     summary: Get all areas for a selected city
 *     description: Returns areas based on the city selected by the user.
 *     tags:
 *       - Location
 *     parameters:
 *       - in: query
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the city
 *     responses:
 *       200:
 *         description: Successfully fetched areas
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               city: Hyderabad
 *               areas:
 *                 - Madhapur
 *                 - Hitech City
 *                 - Gachibowli
 *       400:
 *         description: City missing / invalid query
 *       404:
 *         description: City not found
 *       500:
 *         description: Server error
 */
locationRouter.get("/areas", getAreas);

module.exports = locationRouter;

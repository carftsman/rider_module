const express = require("express");
const adminAuthRouter = express.Router();

const {adminRegister,adminLogin, adminRefreshToken} = require("../controllers/adminAuthController");

/**
 * @swagger
 * /api/auth/admin/register:
 *   post:
 *     tags:
 *       - Admin Authentication
 *
 *     summary: Register new admin
 *
 *     description: >
 *       Creates a new admin account.
 *
 *       Flow:
 *       - Validate admin details
 *       - Check if admin already exists
 *       - Hash password using bcrypt
 *       - Create admin account
 *       - Return admin details
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *             required:
 *               - name
 *               - email
 *               - password
 *
 *             properties:
 *
 *               name:
 *                 type: string
 *                 example: Lakshmi Narayana
 *
 *               email:
 *                 type: string
 *                 example: admin@gmail.com
 *
 *               password:
 *                 type: string
 *                 example: Admin@123
 *
 *               role:
 *                 type: string
 *                 example: ADMIN
 *                 enum:
 *                   - ADMIN
 *                   - SUPER_ADMIN
 *
 *     responses:
 *
 *       201:
 *         description: Admin registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: ADMIN registered successfully
 *
 *                 data:
 *                   type: object
 *
 *                   properties:
 *
 *                     id:
 *                       type: string
 *                       example: clx123abc456
 *
 *                     name:
 *                       type: string
 *                       example: Lakshmi Narayana
 *
 *                     email:
 *                       type: string
 *                       example: admin@gmail.com
 *
 *                     role:
 *                       type: string
 *                       example: ADMIN
 *
 *       400:
 *         description: Admin already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: Admin already exists
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: Server error
 */


adminAuthRouter.post("/register", adminRegister);

/**
 * @swagger
 * /api/auth/admin/login:
 *   post:
 *     tags:
 *       - Admin Authentication
 *
 *     summary: Admin login API
 *
 *     description: >
 *       Authenticates admin using email and password.
 *
 *       Flow:
 *       - Validate admin email
 *       - Verify password
 *       - Generate access token
 *       - Generate refresh token
 *       - Store refresh token in DB
 *       - Return admin details with tokens
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *             required:
 *               - email
 *               - password
 *
 *             properties:
 *
 *               email:
 *                 type: string
 *                 example: admin@gmail.com
 *
 *               password:
 *                 type: string
 *                 example: Admin@123
 *
 *     responses:
 *
 *       200:
 *         description: Admin login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: ADMIN Login successful
 *
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access.token
 *
 *                 refreshToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.token
 *
 *                 admin:
 *                   type: object
 *
 *                   properties:
 *
 *                     id:
 *                       type: string
 *                       example: cmc123456789
 *
 *                     name:
 *                       type: string
 *                       example: Super Admin
 *
 *                     email:
 *                       type: string
 *                       example: admin@gmail.com
 *
 *                     role:
 *                       type: string
 *                       example: ADMIN
 *
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: Invalid credentials
 *
 *       404:
 *         description: Admin not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: Admin not found
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: Server error
 */

adminAuthRouter.post("/login", adminLogin);

/**
 * @swagger
 * /api/auth/admin/refresh:
 *   post:
 *     tags:
 *       - Admin Authentication
 *
 *     summary: Admin refresh token API
 *
 *     description: >
 *       Generates a new access token using a valid refresh token.
 *
 *       Flow:
 *       - Check refresh token in request body
 *       - Verify JWT refresh token
 *       - Validate token type (must be "refresh")
 *       - Check admin exists in DB
 *       - Validate stored refresh token matches request token
 *       - Generate new access token (15m expiry)
 *       - Return new access token
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *             required:
 *               - refreshToken
 *
 *             properties:
 *
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.token.example
 *
 *     responses:
 *
 *       200:
 *         description: New access token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new.access.token
 *
 *       401:
 *         description: Unauthorized / Invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: Refresh token required / Invalid refresh token / Token type invalid / Refresh token not valid
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: Server error
 */

adminAuthRouter.post("/refresh", adminRefreshToken);

module.exports = adminAuthRouter;
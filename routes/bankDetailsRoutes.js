// // const express = require("express");
// // const bankRouter = express.Router();

// // const {
// //   addOrUpdateBankDetails,
// //   getBankDetails,
// //   getBankDetailsStatus,
// //   deleteBankDetails,
// // } = require("../controllers/bankDetailsController");

// // const {
// //   riderAuthMiddleWare,
// // } = require("../middleware/riderAuthMiddleware");

// // // Add / Update bank details
// // /**
// //  * @swagger
// //  * /api/bank/bank-details:
// //  *   post:
// //  *     tags: [Bank Details]
// //  *     summary: Add or update rider bank details
// //  *     description: Saves rider bank account details securely and marks bank account as added.
// //  *     security:
// //  *       - bearerAuth: []
// //  *
// //  *     requestBody:
// //  *       required: true
// //  *       content:
// //  *         application/json:
// //  *           schema:
// //  *             type: object
// //  *             required:
// //  *               - bankName
// //  *               - accountHolderName
// //  *               - accountNumber
// //  *               - ifscCode
// //  *             properties:
// //  *               bankName:
// //  *                 type: string
// //  *                 example: HDFC Bank
// //  *               accountHolderName:
// //  *                 type: string
// //  *                 example: Jagadeesh Kumar
// //  *               accountNumber:
// //  *                 type: string
// //  *                 example: "123456789012"
// //  *               ifscCode:
// //  *                 type: string
// //  *                 example: HDFC0001234
// //  *
// //  *     responses:
// //  *       200:
// //  *         description: Bank details saved successfully
// //  *         content:
// //  *           application/json:
// //  *             schema:
// //  *               type: object
// //  *               properties:
// //  *                 success:
// //  *                   type: boolean
// //  *                   example: true
// //  *                 message:
// //  *                   type: string
// //  *                   example: Bank details saved successfully
// //  * 
// //  * ifscVerificationStatus:
// //   type: string
// //   enum: [PENDING, VERIFIED, FAILED]
// //   example: PENDING

// // bankVerificationStatus:
// //   type: string
// //   enum: [PENDING, VERIFIED, FAILED]
// //   example: VERIFIED
// //  *
// //  *       400:
// //  *         description: Missing or invalid bank details
// //  *
// //  *       401:
// //  *         description: Unauthorized or invalid token
// //  *
// //  *       500:
// //  *         description: Server error
// //  */

// // bankRouter.post("/bank-details", riderAuthMiddleWare, addOrUpdateBankDetails);

// // // Get bank details
// // /**
// //  * @swagger
// //  * /api/bank/bank-details:
// //  *   get:
// //  *     tags: [Bank Details]
// //  *     summary: Get rider bank details
// //  *     description: Fetches saved bank account details for the authenticated rider.
// //  *     security:
// //  *       - bearerAuth: []
// //  *
// //  *     responses:
// //  *       200:
// //  *         description: Bank details fetched successfully
// //  *         content:
// //  *           application/json:
// //  *             schema:
// //  *               type: object
// //  *               properties:
// //  *                 success:
// //  *                   type: boolean
// //  *                   example: true
// //  *                 data:
// //  *                   type: object
// //  *                   properties:
// //  *                     bankName:
// //  *                       type: string
// //  *                       example: HDFC Bank
// //  *                     accountHolderName:
// //  *                       type: string
// //  *                       example: Jagadeesh Kumar
// //  *                     accountNumber:
// //  *                       type: string
// //  *                       example: "123456789012"
// //  *                     ifscCode:
// //  *                       type: string
// //  *                       example: HDFC0001234
// //  *                     addedBankAccount:
// //  *                       type: boolean
// //  *                       example: true
// //  *
// //  *       401:
// //  *         description: Unauthorized or invalid token
// //  *
// //  *       500:
// //  *         description: Server error
// //  */

// // bankRouter.get("/bank-details", riderAuthMiddleWare, getBankDetails);

// // // Bank status (mandatory banner)
// // /**
// //  * @swagger
// //  * /api/bank/bank-details/status:
// //  *   get:
// //  *     tags: [Bank Details]
// //  *     summary: Check bank account status
// //  *     description: Returns whether rider has added bank account details or not.
// //  *     security:
// //  *       - bearerAuth: []
// //  *
// //  *     responses:
// //  *       200:
// //  *         description: Bank account status fetched successfully
// //  *         content:
// //  *           application/json:
// //  *             schema:
// //  *               type: object
// //  *               properties:
// //  *                 success:
// //  *                   type: boolean
// //  *                   example: true
// //  *                 addedBankAccount:
// //  *                   type: boolean
// //  *                   example: false
// //  *
// //  *       401:
// //  *         description: Unauthorized or invalid token
// //  *
// //  *       500:
// //  *         description: Server error
// //  */

// // bankRouter.get(
// //   "/bank-details/status",
// //   riderAuthMiddleWare,
// //   getBankDetailsStatus
// // );

// // // Delete bank details
// // /**
// //  * @swagger
// //  * /api/bank/bank-details:
// //  *   delete:
// //  *     tags: [Bank Details]
// //  *     summary: Remove rider bank details
// //  *     description: Deletes rider bank account details and marks bank account as not added.
// //  *     security:
// //  *       - bearerAuth: []
// //  *
// //  *     responses:
// //  *       200:
// //  *         description: Bank details removed successfully
// //  *         content:
// //  *           application/json:
// //  *             schema:
// //  *               type: object
// //  *               properties:
// //  *                 success:
// //  *                   type: boolean
// //  *                   example: true
// //  *                 message:
// //  *                   type: string
// //  *                   example: Bank details removed successfully
// //  *
// //  *       401:
// //  *         description: Unauthorized or invalid token
// //  *
// //  *       500:
// //  *         description: Server error
// //  */

// // bankRouter.delete("/bank-details", riderAuthMiddleWare, deleteBankDetails);

// // module.exports = bankRouter;


// const express = require("express");
// const bankRouter = express.Router();

// const {
//   addOrUpdateBankDetails,
//   getBankDetails,
//   getBankDetailsStatus,
//   deleteBankDetails,
// } = require("../controllers/bankDetailsController");

// const {
//   riderAuthMiddleWare,
// } = require("../middleware/riderAuthMiddleware");

// // ============================================================
// // ADD / UPDATE BANK DETAILS
// // ============================================================

// /**
//  * @swagger
//  * /api/bank/bank-details:
//  *   post:
//  *     tags: [Bank Details]
//  *     summary: Add or update rider bank details
//  *     description: Saves rider bank account details securely and resets bank & IFSC verification status to PENDING.
//  *     security:
//  *       - bearerAuth: []
//  *
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - bankName
//  *               - accountHolderName
//  *               - accountNumber
//  *               - ifscCode
//  *             properties:
//  *               bankName:
//  *                 type: string
//  *                 example: HDFC Bank
//  *               accountHolderName:
//  *                 type: string
//  *                 example: Jagadeesh Kumar
//  *               accountNumber:
//  *                 type: string
//  *                 example: "123456789012"
//  *               ifscCode:
//  *                 type: string
//  *                 example: HDFC0001234
//  *
//  *     responses:
//  *       200:
//  *         description: Bank details saved successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 message:
//  *                   type: string
//  *                   example: Bank details saved successfully
//  *
//  *       400:
//  *         description: Missing or invalid bank details
//  *       401:
//  *         description: Unauthorized or invalid token
//  *       500:
//  *         description: Server error
//  */

// bankRouter.post(
//   "/bank-details",
//   riderAuthMiddleWare,
//   addOrUpdateBankDetails
// );

// // ============================================================
// // GET BANK DETAILS
// // ============================================================

// /**
//  * @swagger
//  * /api/bank/bank-details:
//  *   get:
//  *     tags: [Bank Details]
//  *     summary: Get rider bank details
//  *     description: Fetches saved bank account details along with IFSC & bank verification status.
//  *     security:
//  *       - bearerAuth: []
//  *
//  *     responses:
//  *       200:
//  *         description: Bank details fetched successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 data:
//  *                   type: object
//  *                   properties:
//  *                     bankName:
//  *                       type: string
//  *                       example: HDFC Bank
//  *                     accountHolderName:
//  *                       type: string
//  *                       example: Jagadeesh Kumar
//  *                     accountNumber:
//  *                       type: string
//  *                       example: "123456789012"
//  *                     ifscCode:
//  *                       type: string
//  *                       example: HDFC0001234
//  *                     addedBankAccount:
//  *                       type: boolean
//  *                       example: true
//  *                     ifscVerificationStatus:
//  *                       type: string
//  *                       enum: [PENDING, VERIFIED, FAILED]
//  *                       example: VERIFIED
//  *                     bankVerificationStatus:
//  *                       type: string
//  *                       enum: [PENDING, VERIFIED, FAILED]
//  *                       example: PENDING
//  *
//  *       401:
//  *         description: Unauthorized or invalid token
//  *       500:
//  *         description: Server error
//  */

// bankRouter.get(
//   "/bank-details",
//   riderAuthMiddleWare,
//   getBankDetails
// );

// // ============================================================
// // BANK DETAILS STATUS (BANNER)
// // ============================================================

// /**
//  * @swagger
//  * /api/bank/bank-details/status:
//  *   get:
//  *     tags: [Bank Details]
//  *     summary: Check bank account status
//  *     description: Returns bank added status along with IFSC & bank verification states for banner handling.
//  *     security:
//  *       - bearerAuth: []
//  *
//  *     responses:
//  *       200:
//  *         description: Bank account status fetched successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 addedBankAccount:
//  *                   type: boolean
//  *                   example: true
//  *                 ifscVerificationStatus:
//  *                   type: string
//  *                   enum: [PENDING, VERIFIED, FAILED]
//  *                   example: VERIFIED
//  *                 bankVerificationStatus:
//  *                   type: string
//  *                   enum: [PENDING, VERIFIED, FAILED]
//  *                   example: PENDING
//  *
//  *       401:
//  *         description: Unauthorized or invalid token
//  *       500:
//  *         description: Server error
//  */

// bankRouter.get(
//   "/bank-details/status",
//   riderAuthMiddleWare,
//   getBankDetailsStatus
// );

// // ============================================================
// // DELETE BANK DETAILS
// // ============================================================

// /**
//  * @swagger
//  * /api/bank/bank-details:
//  *   delete:
//  *     tags: [Bank Details]
//  *     summary: Remove rider bank details
//  *     description: Deletes rider bank account details and resets bank & IFSC verification status.
//  *     security:
//  *       - bearerAuth: []
//  *
//  *     responses:
//  *       200:
//  *         description: Bank details removed successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 message:
//  *                   type: string
//  *                   example: Bank details removed successfully
//  *
//  *       401:
//  *         description: Unauthorized or invalid token
//  *       500:
//  *         description: Server error
//  */

// bankRouter.delete(
//   "/bank-details",
//   riderAuthMiddleWare,
//   deleteBankDetails
// );

// module.exports = bankRouter;

const express = require("express");
const bankRouter = express.Router();

const {
  addOrUpdateBankDetails,
  getBankDetails,
  getBankDetailsStatus,
  deleteBankDetails
} = require("../controllers/bankDetailsController");

const {
  riderAuthMiddleWare
} = require("../middleware/riderAuthMiddleware");

// ============================================================
// ADD / UPDATE BANK DETAILS
// ============================================================

/**
 * @swagger
 * /api/bank/bank-details:
 *   post:
 *     tags: [Bank Details]
 *     summary: Add or update rider bank details
 *     description: |
 *       Adds or updates rider bank account details.
 *       IFSC and bank verification statuses are reset to **PENDING**.
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bankName
 *               - accountHolderName
 *               - accountType
 *               - branch
 *               - accountNumber
 *               - ifscCode
 *             properties:
 *               bankName:
 *                 type: string
 *                 example: HDFC Bank
 *               accountHolderName:
 *                 type: string
 *                 example: Jagadeesh Kumar
 *               accountType:
 *                 type: string
 *                 enum: [CURRENT, SAVINGS]
 *                 example: SAVINGS
 *               branch:
 *                 type: string
 *                 example: Madhapur
 *               accountNumber:
 *                 type: string
 *                 example: "123456789012"
 *               ifscCode:
 *                 type: string
 *                 example: HDFC0001234
 *
 *     responses:
 *       200:
 *         description: Bank details saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Bank details saved successfully
 *
 *       400:
 *         description: Missing or invalid bank details
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */


bankRouter.post(
  "/bank-details",
  riderAuthMiddleWare,
  addOrUpdateBankDetails
);

// (Optional but REST-correct: allow PUT also)
bankRouter.put(
  "/bank-details",
  riderAuthMiddleWare,
  addOrUpdateBankDetails
);

// ============================================================
// GET BANK DETAILS
// ============================================================
/**
 * @swagger
 * /api/bank/bank-details:
 *   get:
 *     tags: [Bank Details]
 *     summary: Get rider bank details
 *     description: Fetches saved bank account details along with verification status.
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Bank details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     bankName:
 *                       type: string
 *                       example: HDFC Bank
 *                     accountHolderName:
 *                       type: string
 *                       example: Jagadeesh Kumar
 *                     accountType:
 *                       type: string
 *                       enum: [CURRENT, SAVINGS]
 *                       example: SAVINGS
 *                     branch:
 *                       type: string
 *                       example: Madhapur
 *                     accountNumber:
 *                       type: string
 *                       example: "123456789012"
 *                     ifscCode:
 *                       type: string
 *                       example: HDFC0001234
 *                     addedBankAccount:
 *                       type: boolean
 *                       example: true
 *                     ifscVerificationStatus:
 *                       type: string
 *                       enum: [PENDING, VERIFIED, FAILED]
 *                       example: PENDING
 *                     bankVerificationStatus:
 *                       type: string
 *                       enum: [PENDING, VERIFIED, FAILED]
 *                       example: PENDING
 *
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */


bankRouter.get(
  "/bank-details",
  riderAuthMiddleWare,
  getBankDetails
);

// ============================================================
// BANK DETAILS STATUS (BANNER CHECK)
// ============================================================
/**
 * @swagger
 * /api/bank/bank-details/status:
 *   get:
 *     tags: [Bank Details]
 *     summary: Get bank verification status
 *     description: Used for mandatory bank banner on rider home screen.
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Bank verification status fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 addedBankAccount:
 *                   type: boolean
 *                   example: true
 *                 ifscVerificationStatus:
 *                   type: string
 *                   enum: [PENDING, VERIFIED, FAILED]
 *                   example: VERIFIED
 *                 bankVerificationStatus:
 *                   type: string
 *                   enum: [PENDING, VERIFIED, FAILED]
 *                   example: PENDING
 *
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */


bankRouter.get(
  "/bank-details/status",
  riderAuthMiddleWare,
  getBankDetailsStatus
);

// ============================================================
// DELETE BANK DETAILS
// ============================================================

/**
 * @swagger
 * /api/bank/bank-details:
 *   delete:
 *     tags: [Bank Details]
 *     summary: Delete rider bank details
 *     description: Removes bank details and resets verification status.
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Bank details deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Bank details removed successfully
 *
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

bankRouter.delete(
  "/bank-details",
  riderAuthMiddleWare,
  deleteBankDetails
);

module.exports = bankRouter;


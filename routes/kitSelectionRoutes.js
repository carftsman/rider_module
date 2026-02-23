const router = require('express').Router()
const{createAsset,
    viewAssets,
    requestAsset,
    approveRequest,
    makePayment,
    dispatchAsset,
    raiseIssue,
    markAsDelivered

}=require('../controllers/kitSelectionController');
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");
const upload = require("../middleware/uploadSelfie");

router.post('/admin/assets', createAsset)
router.get('/rider/assets',riderAuthMiddleWare, viewAssets)
router.post('/rider/request',riderAuthMiddleWare, requestAsset)
router.post('/admin/approve', approveRequest)
router.post('/payment',riderAuthMiddleWare, makePayment)
router.post('/admin/dispatch', dispatchAsset)
router.post('/rider/issue',riderAuthMiddleWare,upload.single("image"), raiseIssue)
router.post('/asset/mark-delivered', markAsDelivered)

module.exports = router
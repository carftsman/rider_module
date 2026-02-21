const router = require('express').Router()
const{createAsset,
    viewAssets,
    requestAsset,
    approveRequest,
    makePayment,
    dispatchAsset,
    raiseIssue

}=require('../controllers/kitSelectionController');
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");


router.post('/admin/assets', createAsset)
router.get('/rider/assets', viewAssets)
router.post('/rider/request',riderAuthMiddleWare, requestAsset)
router.post('/admin/approve', approveRequest)
router.post('/payment', makePayment)
router.post('/admin/dispatch', dispatchAsset)
router.post('/rider/issue', raiseIssue)

module.exports = router
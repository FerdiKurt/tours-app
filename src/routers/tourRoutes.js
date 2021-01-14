const express = require('express')
const tourController = require('../controllers/tourController')
const authController = require('../controllers/authController')
const reviewRouter = require('../routers/reviewRoutes')

const router = express.Router()

// router.param('id', ...someFunction)

// POST /tour/:tourId/reviews
// GET /tour/:tourId/reviews
router.use('/:tourId/reviews', reviewRouter)

router.route('/tour-stats').get(tourController.getTourStats)

router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan)

router
    .route('/top-5-cheap')
    .get(tourController.getFiveCheap, tourController.getAllTours)

router
    .route('/')
    .get(authController.protect, tourController.getAllTours)
    .post(tourController.createTour)

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(tourController.updateTour)
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteTour
    )

module.exports = router
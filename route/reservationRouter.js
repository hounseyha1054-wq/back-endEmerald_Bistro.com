import upload from '../middleware/multer.js'
import express from 'express'
const reservationRouter = express.Router()
import  {addReservation,getAllReservations,removeReservation} from '../controller/reservationController.js'

reservationRouter.post('/add',upload.none(),addReservation)
reservationRouter.get('/get',getAllReservations)
reservationRouter.delete('/remove/:id',removeReservation)

export default reservationRouter
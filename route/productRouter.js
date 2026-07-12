

import express from 'express'
import { Adminlogin } from '../controller/userController.js'
import upload from '../middleware/multer.js'
import adminAuth from '../middleware/adminAuth.js'
import {updateProduct,addProduct,listProduct,removeProduct,singleProduct} from '../controller/productController.js'
const ProductRouter = express.Router()

ProductRouter.post('/add',upload.single('image'),addProduct)
ProductRouter.get('/list',listProduct)
ProductRouter.delete('/remove/:id',removeProduct)
ProductRouter.put('/update/:id',upload.single('image'),updateProduct)
ProductRouter.get('/single/:id',singleProduct)


export default ProductRouter
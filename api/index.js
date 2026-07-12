import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import ConnectDb from '../config/mongoDb.js'
import CloudinaryConfig from '../config/cloundinary.js'
import UserRouter from '../route/userRouter.js'
import ProductRouter from '../route/productRouter.js'
import reservationRouter from '../route/reservationRouter.js'
 
const app = express()
const port = process.env.PORT||4000
ConnectDb()
CloudinaryConfig()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static('uploads'));

app.get('/',(req,res)=>{
    res.send("API is working")
})
app.use('/api/user',UserRouter)
app.use('/api/product',ProductRouter)
app.use('/api/reservation',reservationRouter)

app.listen(port,()=>{
    console.log(`server is runing port http://localhost:${port}`);
    
})
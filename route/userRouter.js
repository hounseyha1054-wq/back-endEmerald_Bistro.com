import express from 'express';
import { Adminlogin, registerUser, loginUser } from '../controller/Usercontroller.js';

const UserRouter = express.Router();

UserRouter.post('/admin', Adminlogin);
UserRouter.post('/register', registerUser);
UserRouter.post('/login', loginUser);

export default UserRouter;

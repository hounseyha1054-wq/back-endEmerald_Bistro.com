import reservationModel from "../model/reservationModel.js";

const addReservation = async(req,res)=>{
    try{
        const {name,email,phone,date,time,guests}= req.body;
       const newReservation= new reservationModel({name,email,phone,date,time,guests})

       await newReservation.save()
       res.json({success: true, message:"Reservation added successfully"})

    }catch(error){
        console.log(error);
        res.status(500).json({message:"Internal server error"})
    }
    
}

const  getAllReservations = async(req,res)=>{
    try{
        const reservation= await reservationModel.find().sort({date:-1})
        res.json(reservation)
    }catch(error){
        console.log(error);
        res.status(500).json({message:"Internal server error"})
    }
}

const  removeReservation = async(req,res)=>{
    try{

        await reservationModel.findByIdAndDelete(req.params.id)
        res.json({message:"Reservation removed successfully"})
    }catch(error){
        console.log(error);
        res.status(500).json({message:"Internal server error"})
    }
}

export {addReservation,getAllReservations,removeReservation}
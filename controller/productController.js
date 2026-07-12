import Product from '../model/product.js'
import cloudinary from 'cloudinary'
const addProduct = async (req, res) => {
    try {
        const { name, price, description, category } = req.body;
        const image = req.file;
        let image_url = "";

        if (image) {
             const result = await cloudinary.uploader.upload(image.path, { resource_type: 'image' });
            image_url = result.secure_url;
        } else {
            image_url = "https://res.cloudinary.com/dzj6d9q0n/image/upload/v1700000000/default_product_image.jpg";
        }

        const productData = {
            name,
            description,
            category,
            price: Number(price),
            image: image_url,
            date: Date.now()
        };

        const newProduct = new Product(productData);
        await newProduct.save();

         res.json({ success: true, message: "Product added successfully" });

    } catch (error){
        console.error("Error in addProduct:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
const listProduct = async(req,res)=>{
        
        try{

        const product = await Product.find().sort({date:-1})
        res.json(product)
                

        }catch(error){
                res.status(500).json({message:"Internal server error"})
        }
    

}

const removeProduct = async (req, res) => {
    try {
        const { id } = req.params;    

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required"
            });
        }

        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            message: "Product removed successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


const singleProduct = async(req,res)=>{

}


const updateProduct = async (req, res) => {
    const { id } = req.params;
    
    try {
         
        const updateData = { ...req.body };

    
        if (req.file) {
            
            updateData.image = req.file.path || req.file.filename; 
        }

       
        const updatedProduct = await Product.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // 4. Return success (added 'success: true' to match your frontend check)
        res.json({ 
            success: true, 
            message: "Product updated successfully", 
            product: updatedProduct 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export {addProduct,listProduct,removeProduct,singleProduct,updateProduct}
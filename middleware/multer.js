import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'uploads/');      
    },
    filename: function (req, file, callback) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        callback(null, uniqueSuffix + path.extname(file.originalname));
    }
});

 
const fileFilter = (req, file, callback) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return callback(null, true);
    } else {
        callback(new Error('Only images (jpg, jpeg, png, webp) are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }  
});

export default upload;
import jwt from 'jsonwebtoken'

const adminAuth = async (req, res, next) => {
    const token = req.headers.token

    if (!token) {
        return res.status(401).json({ message: "Unauthorized user!" })
    }

    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET_KEY)
        if (token_decode.email !== process.env.ADMIN_EMAIL) {
            return res.status(401).json({ status: false, message: "Unauthorized user!" })
        }
        next()
    } catch (error) {
        return res.status(401).json({ status: false, message: "Invalid or expired token" })
    }
}

export default adminAuth

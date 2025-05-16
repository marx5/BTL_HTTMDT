const axios = require('axios');

const verifyRecaptcha = async (token) => {
    try {
        const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
            params: {
                secret: process.env.RECAPTCHA_SECRET_KEY,
                response: token
            }
        });
        return response.data.success;
    } catch (error) {
        console.error('Error verifying reCAPTCHA:', error);
        return false;
    }
};

module.exports = {
    verifyRecaptcha
}; 
const express = require('express');
const router = express.Router()

module.exports = function(client) {
    
    router.get('/send', async(req, res) => {
        const no = req.query.no;
        const text = req.query.text;
        let check = await client.onWhatsApp(`${no}@s.whatsapp.net`)
        if (Array.isArray(check) && check.length) {
            client.sendMessage(`${no}@s.whatsapp.net`, { text })
            res.status(200).send({
                status: true,
                text: text,
                message: `Send Message to ${no}`
            })
        } else {
            res.status(400).send({
                status: false,
                message: `the number (${no}) is not registered on whatsapp`
            })
        }
    })

    return router;
}
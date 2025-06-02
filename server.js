const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const encrypt = require('./encrypt');
const decrypt = require('./decrypt');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Set up multer for file uploads with increased fieldSize for large keys
const upload = multer({ 
    dest: 'uploads/',
    limits: { fieldSize: 100 * 1024 * 1024 } // 100MB, adjust as needed
});

// Serve static files (frontend)
app.use(express.static(__dirname));

// Encrypt endpoint
app.post('/encrypt', upload.single('image'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Always use .png for output, and keep in uploads/
        const base = file.path;
        const outputImageFileName = base + '_encrypted.png';
        const outputKeyFileName = base + '_key.txt';

        const flags = {
            encrypt: file.path,
            outputImageFileName,
            outputKeyFileName
        };

        // Remove existing output files if they exist
        [outputImageFileName, outputKeyFileName].forEach(f => {
            if (fs.existsSync(f)) fs.unlinkSync(f);
        });

        // Patch: encrypt.js expects process.cwd() to be project root
        const cwd = process.cwd();
        process.chdir(__dirname);

        // Run encryption
        await encrypt(flags);

        // Restore cwd
        process.chdir(cwd);

        // Read encrypted image and key
        const encryptedImage = fs.readFileSync(outputImageFileName);
        const key = fs.readFileSync(outputKeyFileName, 'utf8');

        // Clean up uploaded and generated files
        fs.unlinkSync(file.path);
        fs.unlinkSync(outputImageFileName);
        fs.unlinkSync(outputKeyFileName);

        // Send encrypted image and key as response
        res.json({
            encryptedImage: encryptedImage.toString('base64'),
            key: key
        });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Encryption failed' });
    }
});

// Decrypt endpoint
app.post('/decrypt', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'key', maxCount: 1 }
]), async (req, res) => {
    try {
        const file = req.files && req.files.image && req.files.image[0];
        const key = req.body.key;
        if (!file || !key) {
            return res.status(400).json({ error: 'Image and key are required' });
        }

        // Always use .png for output, and keep in uploads/
        const base = file.path;
        const outputImageFileName = base + '_decrypted.png';
        const keyFile = base + '_key.txt';

        fs.writeFileSync(keyFile, key);

        const flags = {
            decrypt: file.path,
            key: keyFile,
            outputImageFileName
        };

        // Remove existing output file if it exists
        if (fs.existsSync(outputImageFileName)) {
            fs.unlinkSync(outputImageFileName);
        }

        // Patch: decrypt.js expects process.cwd() to be project root
        const cwd = process.cwd();
        process.chdir(__dirname);

        // Run decryption
        await decrypt(flags);

        // Restore cwd
        process.chdir(cwd);

        // Read decrypted image
        const decryptedImage = fs.readFileSync(outputImageFileName);

        // Clean up uploaded and generated files
        fs.unlinkSync(file.path);
        fs.unlinkSync(outputImageFileName);
        fs.unlinkSync(keyFile);

        // Send decrypted image as response
        res.json({
            decryptedImage: decryptedImage.toString('base64')
        });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Decryption failed' });
    }
});

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

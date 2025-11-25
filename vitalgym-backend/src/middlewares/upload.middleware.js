const multer = require('multer');
const path = require('path');

// Carpeta destino
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // crea 'uploads/' si no existe
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = file.fieldname + '-' + Date.now() + ext;
    cb(null, name);
  }
});

const upload = multer({ storage });

module.exports = upload;


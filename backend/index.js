const express = require('express');
const AWS = require('aws-sdk');
const multer = require('multer');
const cors = require('cors');

const app = express();
app.use(cors({
  exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length']
}));
//configuración de multer para manejar uploads en memoria y luego subirlos a S3
const upload = multer({ storage: multer.memoryStorage() });

const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localstack:4566';
const BUCKET = process.env.BUCKET || 'drive-clone-bucket';

//configuración de AWS S3
const s3 = new AWS.S3({
  endpoint: S3_ENDPOINT,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
  region: process.env.AWS_REGION || 'us-east-1'
});

//para verificar que el backend está vivo
app.get('/health', (req, res) => res.json({ ok: true }));

//para subir archivos
app.post('/upload', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files' });

    const results = [];
    for (const f of req.files) {
      const key = `${Date.now()}_${f.originalname}`;
      await s3.putObject({ Bucket: BUCKET, Key: key, Body: f.buffer, ContentType: f.mimetype }).promise();
      results.push({ key, originalname: f.originalname, size: f.size });
    }

    return res.json({ uploaded: results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'upload failed' });
  }
});

//para listar los archivos
app.get('/files', async (req, res) => {
  try {
    const data = await s3.listObjectsV2({ Bucket: BUCKET }).promise();
    const items = (data.Contents || [])
      .map(i => ({ key: i.Key, size: i.Size, lastModified: i.LastModified }))
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
      .slice(0, 3);
    res.json({ files: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'could not list files' });
  }
});

//para descargar un archivo
app.get('/download', async (req, res) => { 
  const key = req.query.key;
  if (!key) return res.status(400).send('missing key');
  try {
    const data = await s3.headObject({ Bucket: BUCKET, Key: key }).promise();

    //el nombre limpiodel archivo 
    const originalName = key.split('_').slice(1).join('_') || key;
    const decodedName = decodeURIComponent(originalName); 
    const encodedName = encodeURIComponent(decodedName); 
    res.setHeader('Content-Disposition', `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`);
    res.setHeader('Content-Type', data.ContentType || 'application/octet-stream');
    res.setHeader('Content-Length', data.ContentLength);
    
    const s3Stream = s3.getObject({ Bucket: BUCKET, Key: key }).createReadStream();
    s3Stream.pipe(res);

  } catch (err) {
    console.error(err);
    res.status(404).send('not found');
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log('Backend listening on', port));

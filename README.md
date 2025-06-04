# imcrypt-main Web App

A web-based tool to encrypt and decrypt images using a custom XOR-based algorithm.  
**Developed by Pratik Sharma**

---

## Features

- Encrypt any PNG/JPG image in your browser.
- Download the encrypted image and a short key.
- Decrypt your encrypted image using the key.
- No image or key is stored on the server after processing.

---
![image](https://github.com/user-attachments/assets/8112a0db-064c-4223-a525-7dd060cf3660)
![image](https://github.com/user-attachments/assets/6f87627e-f9af-4e6b-8a3a-19a8f2daba0e)
![image](https://github.com/user-attachments/assets/516c4b4a-1c53-4ce0-a0f5-1710e2f21585)




## Getting Started

### 1. Open the folder image encryptor main in VS CODE :

Make sure all the files are present there that has been provided

### 2. Install dependencies

```sh
npm install
```

### 3. Start the web app

You can use the provided batch file (on Windows):

```sh
start-webapp.bat
```

Or manually:

```sh
node server.js
```

### 4. Open the app

Go to [http://localhost:3000/index.html](http://localhost:3000/index.html) in your browser.

---

## Usage

### Encrypt an Image

1. Click "Select an image to encrypt" and choose your image.
2. Click "Encrypt Image".
3. The encrypted image will be downloaded automatically.
4. Copy and save the generated key (you'll need it to decrypt).

### Decrypt an Image

1. Click "Select an image to decrypt" and choose your encrypted image.
2. Paste the key you saved earlier.
3. Click "Decrypt Image".
4. The decrypted image will be shown in the browser (right-click to save).

---

## Notes

- The encryption key is now short (256 bytes) for speed and usability.
- The server does **not** store your images or keys after processing.
- For best results, use PNG images.

---

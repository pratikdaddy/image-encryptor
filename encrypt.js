const alert = require('cli-alerts');
const fs = require('fs');
const jimp = require('jimp');
const path = require('path');
const readline = require('readline');


// helper functions
function askQuestion(query) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	return new Promise(resolve =>
		rl.question(query, ans => {
			rl.close();
			resolve(ans);
		})
	);
}

const encrypt = async flags => {
	// check if flags contain decrypt flag
	if (flags.decrypt) {
		alert({
			type: `warning`,
			name: `Invalid combination of flags`,
			msg: `Cannot use both --encrypt and --decrypt flags together`
		});
		process.exit(1);
	}

	// Use the filePath directly from flags
	const filePath = flags.encrypt;

	// check if the filePath is a valid file path
	if (!filePath) {
		alert({
			type: `warning`,
			name: `Invalid file path`,
			msg: `Please provide a valid file path`
		});
		process.exit(1);
	}

	// check if the filePath is a valid file path
	if (!fs.existsSync(filePath)) {
		alert({
			type: `warning`,
			name: `Invalid file path`,
			msg: `Please provide a valid file path`
		});
		process.exit(1);
	}

	try {
		const ora = (await import('ora')).default;

		const fileName = path.basename(filePath);
		const fileNameWithoutExtension = fileName.split('.')[0];

		const spinner = ora(`Reading Image...`).start();

		const image = await jimp.read(filePath);
		let extension = image.getExtension();

		if (extension === 'jpeg' || extension === 'jpg') {
			console.warn('Warning: JPEG is a lossy format. Converting to PNG for better encryption.');
			// Convert to PNG in memory
			extension = 'png';
			// Update output file name to .png
			if (flags.outputImageFileName) {
				flags.outputImageFileName = flags.outputImageFileName.replace(/\.[^/.]+$/, ".png");
			}
		}

		spinner.succeed(`Image read successfully`);

		// Use output paths directly from flags
		let outputImageFile = flags.outputImageFileName;
		const spinner2 = ora(`Checking for output image file name`).start();
		spinner2.succeed(`Output image file name is valid`);

		let outputKeyFile = flags.outputKeyFileName;
		const spinner3 = ora(`Checking for output key file name`).start();
		spinner3.succeed(`Output key file name is valid`);

		const spinner4 = ora(`Encrypting image: Reading Image Data`).start();
		const rgba = image.bitmap.data;
		const length = rgba.length;
		spinner4.succeed(`Image data read successfully`);

		const spinner5 = ora(`Encrypting image: Generating key`).start();

		// Use a longer key for better security and image quality, but still fast
		const SHORT_KEY_LENGTH = 256; // 256 bytes
		const key = [];
		for (let i = 0; i < SHORT_KEY_LENGTH; i++) {
			key.push(Math.floor(Math.random() * 256));
		}

		spinner5.succeed(`Key generated successfully`);

		const spinner6 = ora(`Encrypting image: Encrypting image`).start();
		await new Promise(resolve => {
			for (let i = 0; i < length; i++) {
				const k = key[i % SHORT_KEY_LENGTH]; // repeat the key
				rgba[i] = rgba[i] ^ k;
			}
			image.bitmap.data = rgba;
			resolve();
		});
		spinner6.succeed(`Image encrypted successfully`);

		const spinner7 = ora(`Encrypting image: Saving image`).start();

		// Use async write and await its completion
		await new Promise((resolve, reject) => {
			image.write(flags.outputImageFileName, err => {
				if (err) reject(err);
				else resolve();
			});
		});

		spinner7.succeed(`Image saved successfully`);

		const spinner8 = ora(`Encrypting image: Saving key`).start();
		fs.writeFileSync(flags.outputKeyFileName, Buffer.from(key).toString('base64'));
		spinner8.succeed(`Key saved successfully`);

		alert({
			type: `success`,
			name: `Image encrypted successfully`,
			msg: `Image encrypted successfully:\n
			Encrypted Image: ${flags.outputImageFileName}\n
			Key: ${flags.outputKeyFileName}`
		});
	} catch (error) {
		alert({
			type: `error`,
			name: `Error`,
			msg: `${error || 'Unknown error'}`
		});
		throw error;
	}
};

module.exports = encrypt;

const alert = require('cli-alerts');
const fs = require('fs');
const jimp = require('jimp');
const path = require('path');

const decrypt = async flags => {
	// check if flags contain decrypt flag
	if (flags.encrypt) {
		alert({
			type: `warning`,
			name: `Invalid combination of flags`,
			msg: `Cannot use both --encrypt and --decrypt flags together`
		});
		throw new Error('Cannot use both --encrypt and --decrypt flags together');
		// process.exit(1);
	}

	// find the value of the decrypt flag
	const filePath = flags.decrypt;

	// check if the filePath is a valid file path
	if (!filePath) {
		alert({
			type: `warning`,
			name: `Invalid file path`,
			msg: `Please provide a valid file path`
		});
		throw new Error('Please provide a valid file path');
		// process.exit(1);
	}

	// check if the filePath is a valid file path
	if (!fs.existsSync(filePath)) {
		alert({
			type: `warning`,
			name: `Invalid file path`,
			msg: `Please provide a valid file path`
		});
		throw new Error('Please provide a valid file path');
		// process.exit(1);
	}

	// check if the key is in the flags
	if (!flags.key) {
		alert({
			type: `warning`,
			name: `Invalid key`,
			msg: `Please provide a valid key with --key/-k`
		});
		throw new Error('Please provide a valid key with --key/-k');
		// process.exit(1);
	}

	try {
		const ora = (await import('ora')).default;

		const spinner = ora(`Reading Image...`).start();

		const image = await jimp.read(filePath);

		// get the image extension using jimp
		const extension = image.getExtension();

		// get the rgba values of the image
		const rgba = image.bitmap.data;

		// get the length of the rgba array
		const length = rgba.length;

		spinner.succeed(`Image read successfully`);

		const spinner2 = ora(`Getting the key`).start();

		// get the key
		const keyPath = flags.key;

		// check if the keyPath is a valid file path
		if (!fs.existsSync(keyPath)) {
			spinner2.fail(`Invalid key path`);
			alert({
				type: `error`,
				name: `Invalid key path`,
				msg: `Please provide a valid key path with --key/-k`
			});
			throw new Error('Please provide a valid key path with --key/-k');
			// process.exit(1);
		}

		// get the base64 encoded key
		const key = fs.readFileSync(keyPath, 'utf8');

		// decode the key
		const keyDecoded = Buffer.from(key, 'base64');
		const keyArray = Array.from(keyDecoded);
		const SHORT_KEY_LENGTH = keyArray.length; // should be 256

		// Accept any key length <= image data, repeat as needed
		if (SHORT_KEY_LENGTH < length) {
			// ok, will repeat the key
		} else if (SHORT_KEY_LENGTH !== length) {
			spinner2.fail(`Invalid key`);
			alert({
				type: `error`,
				name: `Invalid key`,
				msg: `The key is not valid`
			});
			throw new Error('The key is not valid');
		}

		spinner2.succeed(`Key read successfully`);

		const spinner3 = ora(`Decrypting...`).start();

		// loop through the rgba array, repeat the key
		for (let i = 0; i < length; i++) {
			const k = keyArray[i % SHORT_KEY_LENGTH];
			rgba[i] = rgba[i] ^ k;
		}

		// save the image with _decrypted appended to the file name, mimeType and the new extension
		image.bitmap.data = rgba;

		spinner3.succeed(`Decryption successful`);

		// save the image
		// get file base name before _encrypted

		const spinner4 = ora(`Saving image...`).start();

		const fileName = path
			.basename(filePath)
			// remove _encrypted from the file name if present
			.replace(/\_encrypted$/, '');

		// remove the extension from the file name
		let fileNameWithoutExtension = `${fileName.split('.')[0]}_decrypted`;

		let outputImageFile = flags.outputImageFileName;
		// No need to modify outputImageFile, just use as is

		// Use async write and await its completion
		await new Promise((resolve, reject) => {
			image.write(outputImageFile, err => {
				if (err) reject(err);
				else resolve();
			});
		});

		spinner4.succeed(`Image saved successfully`);

		alert({
			type: `success`,
			name: `Success`,
			msg: `Image decrypted successfully\n
			Decrypted Image: ${outputImageFile}`
		});
	} catch (err) {
		alert({
			type: `error`,
			name: `Error`,
			msg: `${err}`
		});
		throw err;
		// process.exit(1);
	}
};

module.exports = decrypt;

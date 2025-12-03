/**
 * Flattens an array of hex string fields into a single Uint8Array
 */
export function flattenFieldsAsArray(fields: string[]): Uint8Array {
	const flattenedPublicInputs = fields.map(hexToUint8Array);
	return flattenUint8Arrays(flattenedPublicInputs);
}

/**
 * Flattens multiple Uint8Array into a single Uint8Array
 */
function flattenUint8Arrays(arrays: Uint8Array[]): Uint8Array {
	const totalLength = arrays.reduce((acc, val) => acc + val.length, 0);
	const result = new Uint8Array(totalLength);

	let offset = 0;
	for (const arr of arrays) {
		result.set(arr, offset);
		offset += arr.length;
	}

	return result;
}

/**
 * Converts a hex string to Uint8Array
 */
function hexToUint8Array(hex: string): Uint8Array {
	const sanitisedHex = BigInt(hex).toString(16).padStart(64, "0");

	const len = sanitisedHex.length / 2;
	const u8 = new Uint8Array(len);

	let i = 0;
	let j = 0;
	while (i < len) {
		u8[i] = Number.parseInt(sanitisedHex.slice(j, j + 2), 16);
		i += 1;
		j += 2;
	}

	return u8;
}

/**
 * Loads the verification key from the assets folder
 */
export async function loadVerificationKey(vkUrl: string): Promise<Uint8Array> {
	const response = await fetch(vkUrl);
	const arrayBuffer = await response.arrayBuffer();
	return new Uint8Array(arrayBuffer);
}

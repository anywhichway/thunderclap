(function() {
	function bufferToHexString(buffer) {
	    var s = '', h = '0123456789ABCDEF';
	    (new Uint8Array(buffer)).forEach((v) => { s += h[v >> 4] + h[v & 15]; });
	    return s;
	}
	async function generateKey(password,iterations) {
	    const salt = crypto.getRandomValues(new Uint8Array(8)),
	    	encoder = new TextEncoder('utf-8'),
	    	passphraseKey = encoder.encode(password),
	    	key = await crypto.subtle.importKey(
			  'raw', 
			  passphraseKey, 
			  {name: 'PBKDF2'}, 
			  false, 
			  ['deriveBits', 'deriveKey']
			),
			webKey = await crypto.subtle.deriveKey(
			    {
			    	name: 'PBKDF2',
			    	salt,
			    	iterations,
			    	hash: 'SHA-256'
			    },
			    key,
			    // Note: we don't actually need a cipher suite,
			    // but the api requires that it must be specified.
			    // For AES the length required to be 128 or 256 bits (not bytes)
			    { name: 'AES-CBC', length: 256 },
		
			    // Whether or not the key is extractable (less secure) or not (more secure)
			    true,
		
			    // this web crypto object will only be allowed for these functions
			    [ "encrypt", "decrypt" ]
			), 
			buffer = await crypto.subtle.exportKey("raw", webKey);
		return {
			hash: bufferToHexString(buffer),
			salt: bufferToHexString(salt)
		}
	}
	module.exports = generateKey;
}).call(this)
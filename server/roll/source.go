package roll

import (
	cryptoRand "crypto/rand"
)

// RandBytes is a type from which random bytes may be read.
// Implementors include math.Rand, roll.CryptoRandSource() and bytes.Buffer.
type RandBytes interface {
	Read(b []byte) (n int, err error)
}

// cryptoRandSource implements RandBytes by calling `crypto.rand.Read()`
type cryptoRandSource struct{}

// Read calls `crypto.rand.Read(b)`.
func (c *cryptoRandSource) Read(b []byte) (n int, err error) {
	return cryptoRand.Read(b)
}

// CryptoRandSource returns a RandBytes which calls `crypto.rand.Read()`.
func CryptoRandSource() RandBytes {
	return &cryptoRandSource{}
}

package roll

import (
	"crypto/rand"
)

// RandBytes is a type from which random bytes may be read.
// math.Rand implements RandBytes. See CryptoRandSource() for
// a crypto.rand backed source.
type RandBytes interface {
	Read(b []byte) (n int, err error)
}

// cryptoRandSource implements RandBytes by calling crypto/rand.Read()
type cryptoRandSource struct {}

// Read calls crypto/rand.Read(b).
func (c *cryptoRandSource) Read(b []byte) (n int, err error) {
	return rand.Read(b)
}

// CryptoRandSource returns a RandBytes which calls crypto/rand.Read().
func CryptoRandSource() RandBytes {
	return &cryptoRandSource{}
}

// debugRandBytes is a RandBytes which cycles an internal source when
// Read() is called.
type debugRandBytes struct {
	source []byte
}

// Read will cycle through d's source bytes. It always returns len(b), nil.
func (d *debugRandBytes) Read(b []byte) (n int, err error) {
	// Cycle source into b.
	for i, j := 0, 0; i < len(b); i++ {
		if j > len(d.source) {
			j = 0
		}
		b[i] = d.source[j]
		j++
	}
	return len(b), nil
}

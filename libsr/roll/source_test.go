package roll

import (
	"bytes"
	"errors"
)

// mockSource produces a RandBytes which emits bytes from the given input, then
// returns errors (io.EOF unless input is zero length).
func mockSource(input []byte) *bytes.Buffer {
	return bytes.NewBuffer(input)
}

// cycleRandBytes is a RandBytes which cycles an internal source when
// Read() is called.
type cycleRandBytes struct {
	source []byte
}

// Read will cycle through d's source bytes. It always returns len(b), nil.
func (c *cycleRandBytes) Read(b []byte) (n int, err error) {
	// Cycle source into b.
	for i, j := 0, 0; i < len(b); i++ {
		if j > len(c.source) {
			j = 0
		}
		b[i] = c.source[j]
		j++
	}
	return len(b), nil
}

var errChanClosed = errors.New("channel was closed")

type channelRandBytes struct {
	source <-chan byte
}

func (c *channelRandBytes) Read(b []byte) (n int, err error) {
	for i := 0; i < n; i++ {
		received, ok := <-c.source
		if !ok {
			return i, errChanClosed
		}
		b[i] = received
	}
	return len(b), nil
}

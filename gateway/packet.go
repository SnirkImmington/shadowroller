package gateway

import (
	"strconv"
	"strings"

	"shadowroller.net/libsr/errs"
)

// Packet is a packet sent over the gateway API. It usually corresponds to a
// message on the queue.
type Packet struct {
	// Seq is the client sequence number for a request.
	Seq int
	// Cmd is the command of the packet.
	Cmd string
	// ID is the ID of the entity associated with the packet.
	ID string
	// Body is the body of the packet, which varies based on packet.
	Body string
}

/*

1 player:get <playerID>
1 200 {"id":"<playerID>","hue":22,"username": ... }

2 player:update @me {"hue":122}
2 200 {"commit":"123456-0"}
-> player:update [id] {"hue":122,"commit":"213456-0"}

3 player:update @notme {"hue":22}
3 401 // "invalid player ID"

*/

func (p *Packet) MarshalText() ([]byte, error) {
	result := strings.Builder{}
	result.WriteString(strconv.FormatInt(int64(p.Seq), 10))
	result.WriteString(" ")
	result.WriteString(p.Cmd)
	result.WriteString(" ")
	result.WriteString(p.ID)
	result.WriteString(" ")
	result.WriteString(p.Body)
	return []byte(result.String()), nil
}

func (p *Packet) UnmarshalText(text []byte) error {
	firstSpace := strings.IndexRune(string(text), ' ')
	if firstSpace == -1 {
		return errs.Parsef("expected space after command")
	}
	cmdBytes := text[0:firstSpace]
	text = text[:firstSpace]

	secondSpace := strings.IndexRune(string(text), ' ')
	if secondSpace == -1 {
		return errs.Parsef("char %v: expected space after ID", firstSpace)
	}
	idBytes := text[:secondSpace]
	text = text[secondSpace:]

	p.Cmd = string(cmdBytes)
	p.ID = string(idBytes)
	p.Body = string(text)
	return nil
}

package stream

import (
	"encoding/json"
	"time"
)

type ReplyMode int

const ReplyModeNone = 0
const ReplyModePush = 1
const ReplyModePublish = 2

type Request struct {
	ID string
}

type MessageHeaders struct {
	From    string
	Reply   ReplyMode
	Expires time.Time
	After   time.Time
}

type Message struct {
	ID      string
	Headers MessageHeaders
	Body    string
}

func (m *Message) Deserialize(out interface{}) error {
	return json.Unmarshal([]byte(m.Body), out)
}

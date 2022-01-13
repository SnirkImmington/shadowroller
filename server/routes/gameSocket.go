package routes

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const PROTOCOLS = []string{
	"sr:connv1",
	"sr:plrv1",
	"sr:gamev1",
}

type wsPoolPool sync.Pool

func (p *wsPoolPool) Get()

var upgrader = websocket.Upgrader{
	// Duration for handshake to complete
	HandshakeTimeout: time.Duration(15) * time.Second,
	// I.O buffer sizes - affect
	ReadBufferSize:  512,
	WriteBufferSize: 512,
	WriteBufferPool: &sync.Pool{},
}

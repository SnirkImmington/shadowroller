package routes

import (
	"time"
	"github.com/gomodule/redigo/redis"
	"github.com/gorilla/websocket"
	"sr/config"
	redisUtil "sr/redis"
)

// SRProtocol is the protocol version
const SRProtocol = "sr-1.0";

// ClientConn
type ClientConn struct {
	clientConn *websocket.Conn
	redisConn redis.Conn
	receivedPong bool
	ticker *time.Ticker
}

func Connect(conn *websocket.Conn) ClientConn {
	return ClientConn{
		clientConn: conn,
		redisConn: redisUtil.Connect(),
		receivedPong: true,
		ticker: time.NewTicker(time.Duration(config.WSPingSecs) * time.Second),
	}
}

func (c *ClientConn) Run() {
	for {
		select {
		case <- c.ticker.C:
			break
		}
	}
}

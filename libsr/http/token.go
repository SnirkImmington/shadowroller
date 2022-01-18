package http

import (
	cryptoRand "crypto/rand"
	"encoding/base64"
	"fmt"
	"math/rand"
	"time"

	"shadowroller.net/libsr/config"
	"shadowroller.net/libsr/id"

	jwt "github.com/golang-jwt/jwt/v4"
	jwtRequest "github.com/golang-jwt/jwt/v4/request"
)

// AuthClaims is the data on a standard auth token.
type AuthClaims struct {
	// PlayerID is the ID of the current player
	PlayerID string `json:"sr.pid"`

	Version string `json:"sr.v"`

	jwt.RegisteredClaims
}

func MakeAuthClaims(playerID id.UID) AuthClaims {
	now := time.Now()
	exp := now.Add(time.Duration(5) * time.Hour)

	nowJWT := jwt.NewNumericDate(now)
	expJWT := jwt.NewNumericDate(exp)

	return AuthClaims{
		PlayerID: string(playerID),
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    config.BackendOrigin.Hostname(),
			IssuedAt:  nowJWT,
			NotBefore: nowJWT,
			ExpiresAt: expJWT,
		},
	}
}

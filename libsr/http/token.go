package http

import (
	cryptoRand "crypto/rand"
	"encoding/base64"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"shadowroller.net/libsr/config"
	"shadowroller.net/libsr/errs"
	"shadowroller.net/libsr/id"

	jwt "github.com/golang-jwt/jwt/v4"
	jwtRequest "github.com/golang-jwt/jwt/v4/request"
)

// AuthClaims is the data on a standard auth token.
type AuthClaims struct {
	// PlayerID is the ID of the current player
	PlayerID string `json:"sr.pid"`

	// Version is the version of the token
	Version int `json:"sr.v"`

	jwt.RegisteredClaims
}

func MakeAuthClaims(now time.Time, playerID id.UID, persist bool) *AuthClaims {
	var dur time.Duration
	if persist {
		dur = time.Duration(config.PersistSessionTTLDays) * time.Hour * 24
	} else {
		dur = time.Duration(config.TempSessionTTLSecs) * time.Second
	}
	exp := now.Add(dur)

	nowJWT := jwt.NewNumericDate(now)
	expJWT := jwt.NewNumericDate(exp)

	return &AuthClaims{
		PlayerID: string(playerID),
		Version:  config.JWTVersion,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    config.BackendOrigin.Hostname(),
			IssuedAt:  nowJWT,
			NotBefore: nowJWT,
			ExpiresAt: expJWT,
		},
	}
}

// TODO should be a private method with secure compare
func (c *AuthClaims) Verify(now time.Time) error {
	if c.Issuer != config.BackendOrigin.Hostname() {
		return errs.NoAccessf("invalid issuer %v", c.Issuer)
	}
	if !c.VerifyIssuedAt(now, true) {
		return errs.NoAccessf("invalid issued at")
	}
	if !c.VerifyExpiresAt(now, true) {
		return errs.NoAccessf("invaild expires at")
	}
	if !c.VerifyNotBefore(now, true) {
		return errs.NoAccessf("invalid not before")
	}
	if c.Version == 0 {
		return errs.BadRequestf("invalid version 0")
	}
	// c.Version == 1, okay
	if c.Version > config.JWTVersion {
		return errs.BadRequestf("future version %v", c.Version)
	}
	return nil
}

func MakeTokenString(now time.Time, playerID id.UID, persist bool) (string, error) {
	claims := MakeAuthClaims(now, playerID, persist)
	token := jwt.NewWithClaims(jwt.SigningMethodHS512, claims)
	signed, err := token.SignedString(config.JWTKey)
	if err != nil {
		return "", errs.Internal(err)
	}
	return signed, nil
}

func TokenForRequest(now time.Time, request *http.Request) (*AuthClaims, error) {
	var claims *AuthClaims
	token, err := jwtRequest.ParseFromRequest(
		request,
		jwtRequest.AuthorizationHeaderExtractor,
		func(token *jwt.Token) (interface{}, error) {
			// Not entirely sure how to check version
			if token.Method.Alg() != jwt.SigningMethodHS512.Name {
				return nil, errs.NoAccessf("invalid alg %v", token.Method.Alg())
			}
			return config.JWTKey, nil
		},
		jwtRequest.WithClaims(claims),
	)
	if err != nil {
		return nil, err
	}
	// Check version field on claims
	// Token verification should be a separate method.
	if err := claims.Verify(now); err != nil {
		return nil, err
	}
	return claims, nil
}

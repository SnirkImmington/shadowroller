package http

import (
	"crypto/subtle"
	"net/http"
	"time"

	"shadowroller.net/libsr/config"
	"shadowroller.net/libsr/errs"
	"shadowroller.net/libsr/id"

	jwt "github.com/golang-jwt/jwt/v4"
	jwtRequest "github.com/golang-jwt/jwt/v4/request"
)

// AuthClaims is the data on a standard auth token. These claims, when signed,
// indicate that a player existed at the time of creation with the given role.
// It is the responsiblity of an API handler to check that the player
// corresponding to these claims still exists when using them, and to monitor
// `player:playerID:update` if the connection is persistent.
type AuthClaims struct {
	// PlayerID is the ID of the current player
	PlayerID string `json:"sr.pid"`

	// Version is the version of the token
	Version int `json:"sr.v"`

	jwt.RegisteredClaims
}

// MakeAuthClaims constructs a new AuthClaims for the player.
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

// verify checks that the fields on the claims are valid in constant time,
// checking all fields. It returns a list of found errors, either NoAccessf for
// an expired token or BadRequestf for a token we shouldn't've created in the
// first place.
func (c *AuthClaims) verify(now time.Time) []error {
	res := make([]error, 0, 8)
	issuer := []byte(c.Issuer)
	hostname := []byte(config.BackendOrigin.Hostname())
	if subtle.ConstantTimeCompare(issuer, hostname) != 1 {
		res = append(res, errs.BadRequestf("invalid issuer %v", c.Issuer))
	}
	if !c.VerifyIssuedAt(now, true) {
		res = append(res, errs.NoAccessf("invalid issued at"))
	}
	if !c.VerifyExpiresAt(now, true) {
		res = append(res, errs.NoAccessf("invaild expires at"))
	}
	if !c.VerifyNotBefore(now, true) {
		res = append(res, errs.NoAccessf("invalid not before"))
	}
	if subtle.ConstantTimeEq(int32(c.Version), 0) == 1 {
		res = append(res, errs.BadRequestf("invalid version 0"))
	}
	// Want c.Version > config.JWTVersion or c.Version >= config.JWTVersion + 1
	// can do config.JWTVersion < c.Version or config.JWTVersion +1 <= c.Version
	if subtle.ConstantTimeLessOrEq(config.JWTVersion+1, c.Version) == 1 {
		res = append(res, errs.BadRequestf("future version %v", c.Version))
	}
	// else c.Version == config.JWTVersion, okay
	return res
}

// MakeTokenString constructs an AuthClaims, signs it, and returns the jwt string.
// It returns errs.ErrInternal for an error on signing from the JWT library
// usually indicating a bad key or broken configuration.
func MakeTokenString(now time.Time, playerID id.UID, persist bool) (string, error) {
	claims := MakeAuthClaims(now, playerID, persist)
	token := jwt.NewWithClaims(jwt.SigningMethodHS512, claims)
	signed, err := token.SignedString(config.JWTKey)
	if err != nil {
		return "", errs.Internal(err)
	}
	return signed, nil
}

// TokenForRequest parses the JWT from the Auth header, verifies it in constant
// time, and returns the token if there are no issues. Returns a list of errors
// found when validating the token.
//
// Returns errors:
// - NoAccesss: "invalid token %v" for attempting to use a token of the wrong
// type (i.e. sendig a "none").
// - BadRequest: Invalid `iss` or future `sr.v` version field
// - NoAccess: issued at, expires at, or not before are invalid
func VerifiedTokenFromRequest(now time.Time, request *http.Request) (*AuthClaims, []error) {
	var claims *AuthClaims
	_, err := jwtRequest.ParseFromRequest(
		request,
		jwtRequest.AuthorizationHeaderExtractor,
		func(token *jwt.Token) (interface{}, error) {
			// Not entirely sure how to check version
			if token.Method.Alg() != jwt.SigningMethodHS512.Name {
				return nil, errs.NoAccessf("invalid token alg %v", token.Method.Alg())
			}
			return config.JWTKey, nil
		},
		jwtRequest.WithClaims(claims),
	)
	if err != nil {
		return nil, []error{err}
	}
	if err := claims.verify(now); err != nil {
		return nil, err
	}
	return claims, nil
}

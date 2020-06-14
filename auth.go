package srserver

// Authentication

import (
	cryptoRand "crypto/rand"
	"encoding/base64"
	"fmt"
	"github.com/dgrijalva/jwt-go"
	jwtRequest "github.com/dgrijalva/jwt-go/request"
	"math/rand"
	"net/http"
	"srserver/config"
)

type AuthClaims struct {
	GameID     string `json:"gid"`
	PlayerID   string `json:"pid"`
	PlayerName string `json:"pname"`
	jwt.StandardClaims
}

func (auth *AuthClaims) String() string {
	return fmt.Sprintf("%v (%v) in %v",
		auth.PlayerID, auth.PlayerName, auth.GameID,
	)
}

func GenUID() string {
	bytes := make([]byte, 6)
	rand.Read(bytes)
	return base64.StdEncoding.EncodeToString(bytes)
}

func GenKey(size int64) string {
	bytes := make([]byte, size)
	cryptoRand.Read(bytes)
	return base64.URLEncoding.EncodeToString(bytes)
}

func getJWTSecretKey(token *jwt.Token) (interface{}, error) {
	if token.Method != jwt.SigningMethodHS256 {
		return nil, jwt.ErrInvalidKeyType
	}
	return config.JWTSecretKey, nil
}

func createAuthCookie(gameID string, playerID string, playerName string) (*http.Cookie, error) {
	claims := AuthClaims{
		GameID:     gameID,
		PlayerID:   playerID,
		PlayerName: playerName,
		StandardClaims: jwt.StandardClaims{
			Issuer: "sr-server",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(config.JWTSecretKey)
	if err != nil {
		return nil, err
	}

	return &http.Cookie{
		Name:  "srAuth",
		Value: signed,
		// Domain:   config.CookieAddress,
		Secure:   config.IsProduction, // http cookies on local env
		SameSite: http.SameSiteNoneMode,
		HttpOnly: false, // JS should read cookie to reconnect
		MaxAge:   config.AuthCookieMaxAge,
	}, nil
}

type CookieExtractor struct{ Name string } // name of cookie to extract
func (c *CookieExtractor) ExtractToken(request *Request) (string, error) {
	cookie, err := request.Cookie(c.Name)
	if err != nil {
		return "", err
	}
	return cookie.Value, nil
}

func authForRequest(request *Request) (*AuthClaims, error) {
	token, err := jwtRequest.ParseFromRequest(
		request,
		&CookieExtractor{"srAuth"},
		getJWTSecretKey,
		jwtRequest.WithClaims(&AuthClaims{}),
	)
	if err != nil {
		return nil, err
	}
	auth, ok := token.Claims.(*AuthClaims)
	if !ok || !token.Valid {
		return nil, jwt.ErrInvalidKeyType
	}
	return auth, nil
}

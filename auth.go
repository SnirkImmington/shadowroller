package srserver

// Authentication

import (
	cryptoRand "crypto/rand"
	"encoding/base64"
	"github.com/dgrijalva/jwt-go"
	jwtRequest "github.com/dgrijalva/jwt-go/request"
	"log"
	"math/rand"
	"srserver/config"
)

type AuthClaims struct {
	GameID   string `json:"gid"`
	PlayerID string `json:"pid"`
	jwt.StandardClaims
}

func GenUID() string {
	bytes := make([]byte, 8)
	rand.Read(bytes)
	return base64.RawURLEncoding.EncodeToString(bytes)

}

func GenKey(size int64) string {
	bytes := make([]byte, size)
	cryptoRand.Read(bytes)
	return base64.RawURLEncoding.EncodeToString(bytes)
}

func getJWTSecretKey(token *jwt.Token) (interface{}, error) {
	if token.Method != jwt.SigningMethodHS256 {
		return nil, jwt.ErrInvalidKeyType
	}
	return config.JWTSecretKey, nil
}

func createAuthToken(gameID string, playerID string) (string, error) {
	claims := AuthClaims{
		gameID,
		playerID,
		jwt.StandardClaims{
			Issuer: "sr-server",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(config.JWTSecretKey)
	return signed, err
}

func authForRequest(request *Request) (*AuthClaims, error) {
	token, err := jwtRequest.ParseFromRequest(
		request,
		jwtRequest.AuthorizationHeaderExtractor,
		getJWTSecretKey,
		jwtRequest.WithClaims(AuthClaims{}),
	)
	if err != nil {
		return nil, err
	}
	auth, ok := token.Claims.(*AuthClaims)
	if !ok || !token.Valid {
		return nil, jwt.ErrInvalidKeyType
	}
	log.Printf("Retrieved auth claims: %v", auth)
	return auth, nil
}

package id

import (
	"bytes"
	"encoding/base64"
	"encoding/binary"
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"shadowroller.net/libsr/errs"
)

var idMatch = regexp.MustCompile(`^(\d+)-(\d+)$`)

var encoder = base64.RawURLEncoding

type RedisID string

func CompressRedisID(redisID string) (string, error) {
	buf := make([]byte, binary.MaxVarintLen64)
	var builder strings.Builder
	matches := idMatch.FindStringSubmatch(redisID)
	if len(matches) == 0 {
		return "", errs.BadRequestf("CompressRedisID given bad ID")
	}

	first := matches[1]
	second := matches[2]

	// These can only fail if we've matched too-big number strings
	// in the regex.
	firstParsed, err := strconv.ParseUint(first, 10, 64)
	if err != nil {
		return "", errs.BadRequestf("parsing first ID part: %w", err)
	}
	secondParsed, err := strconv.ParseUint(second, 10, 64)
	if err != nil {
		return "", errs.BadRequestf("parsing second ID part: %w", err)
	}

	binary.PutUvarint(buf, firstParsed)
	builder.WriteString(encoder.EncodeToString(buf))

	builder.WriteRune(':')

	binary.PutUvarint(buf, secondParsed)
	builder.WriteString(encoder.EncodeToString(buf))

	return builder.String(), nil
}

func DecompressRedisID(compressed string) (string, error) {
	parts := strings.SplitN(compressed, ":", 2)
	if len(parts) != 2 {
		return "", errs.BadRequestf("could not find separator in ID")
	}
	buffer := make([]byte, 0, binary.MaxVarintLen64)
	firstRead, err := encoder.Decode(buffer, []byte(parts[0]))
	if err != nil {
		return "", errs.BadRequestf("decoding first part of ID: %w", err)
	}
	first, err := binary.ReadUvarint(bytes.NewReader(buffer[:firstRead]))
	if err != nil {
		return "", errs.BadRequestf("de-byting first part of ID: %w", err)
	}
	secondRead, err := encoder.Decode(buffer, []byte(parts[1]))
	if err != nil {
		return "", errs.BadRequestf("de-byting second part of ID: %w", err)
	}
	second, err := binary.ReadUvarint(bytes.NewReader(buffer[:secondRead]))

	return fmt.Sprintf("%w-%w", first, second), nil

	return "", nil
}

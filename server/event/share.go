package event

import ()

// Share is the ability of players to see an event
type Share int

// ShareInGame is share to all players in a game
const ShareInGame = Share(0)

// SharePrivate is share only to the originator of the event
const SharePrivate = Share(1)

// ShareGMs is share to the gamemasters in addition to event originator
const ShareGMs = Share(2)

// String() provides a string-enum version of the Share
func (a Share) String() string {
	switch a {
	case ShareInGame:
		return "inGame"
	case SharePrivate:
		return "private"
	case ShareGMs:
		return "gms"
	default:
		return "unknown"
	}
}

// ShareFromString parses a string representation of a share
func ShareFromString(share string) (Share, bool) {
	switch share {
	case "inGame":
		return ShareInGame, true
	case "private":
		return SharePrivate, true
	case "gms":
		return ShareGMs, true
	default:
		return ShareInGame, false
	}
}

// IsShare determines if a number matches an share
func IsShare(share int) bool {
	return share == int(ShareInGame) || share == int(SharePrivate) || share == int(ShareGMs)
}

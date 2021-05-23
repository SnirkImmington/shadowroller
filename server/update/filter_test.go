package update

import (
	"encoding/json"
	"testing"

	"sr/id"
	"sr/test"
)

func TestParseExlude(t *testing.T) {
	t.Run("it parses no exclude", func(t *testing.T) {
		ud := playerOnline{id: id.UID("someplayer"), online: false}
		udBytes, err := json.Marshal(ud)
		test.AssertSuccess(t, err, "marshaling json")
		excludeID, excludeGMs, inner, found := ParseExclude(string(udBytes))
		test.Assert(t, !found, "exclude found", false, true)
		test.AssertEqual(t, inner, string(udBytes))
		test.AssertEqual(t, excludeID, id.UID(""))
		test.AssertEqual(t, excludeGMs, false)
	})
	t.Run("it parses an exclude", func(t *testing.T) {
		ud := playerOnline{id: id.UID("someplayer"), online: false}
		udBytes, err := json.Marshal(&ud)
		t.Logf("Update: %v", string(udBytes))
		test.AssertSuccess(t, err, "marshaling json")
		exclude := WithFilters([]string{"someotherplayer", "gms"}, &ud)
		excludeStr, err := exclude.Serialize()
		test.AssertSuccess(t, err, "serializing exclude")
		t.Logf("Exclude: %v", excludeStr)
		excludeID, excludeGMs, inner, found := ParseExclude(excludeStr)
		test.Assert(t, found, "exclude found", true, false)
		test.AssertEqual(t, inner, string(udBytes))
		test.AssertEqual(t, excludeID, id.UID("someotherplayer"))
		test.AssertEqual(t, excludeGMs, true)
	})
}

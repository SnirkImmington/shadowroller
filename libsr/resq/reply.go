package resq

import (
	"encoding/json"

	"shadowroller.net/libsr/errs"
)

type Reply struct {
	Status error  `redis:"res,omitempty"`
	Body   []byte `redis:"body"`
}

func (r *Reply) Ok() bool {
	return r.Result == nil
}

func (r *Reply) Result(val *interface{}) error {
	if r.Status != nil {
		return r.Status
	}
	if len(r.Body) == 0 {
		return nil
	}
	return errs.BadRequest(json.Unmarshal(r.Body, val))
}

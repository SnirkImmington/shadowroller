package errs

import (
	"errors"
	"fmt"
	netHTTP "net/http"
)

var (
	// ErrHalt is panic()ed by handlers which wish to return early. This error
	// indicates a sucessful operation.
	ErrHalt = netHTTP.ErrAbortHandler

	// ErrInternal represents any internal error which cannot be properly
	// handled. This error indicates a potentially fatal operation.
	ErrInternal = errors.New("internal error")

	// ErrBadRequest indicates any error which arises due to parameters or
	// inputs to a function, rather than an inconsistent or broken internal
	// state. This error indicates a non-fatal operation.
	ErrBadRequest = errors.New("bad request")

	// ErrNotFound indicates a non-erroneous state, in which a resource that
	// was not guaranteed to exist was not found. This error is meant to be
	// used in place of a boolean in functions which can additionaly return
	// actual errors.
	ErrNotFound = errors.New("not found")

	// ErrNoAccess indicates a request in which the caller is performing an
	// operation on behalf of an entitity, that that entity does not have access
	// to the resource it requested.
	ErrNoAccess = errors.New("no access")

	// ErrParse is a specific case of an internal error, in which some operation
	// which converts data between formats (such as to and from text or JSON)
	// failed.
	ErrParse = fmt.Errorf("%w: parse", ErrInternal)
	// ErrLogic is a specific example of an internal error, in which improperly
	// written code caused an undesired state or output. Not all logic errors
	// may be reported.
	ErrLogic = fmt.Errorf("%w: logic", ErrInternal)
	// ErrTimeout is an error reported by various functions which can time out
	ErrTimeout = fmt.Errorf("%w: timeout", ErrInternal)
)

func Halt() error {
	return ErrHalt
}

func caused(base error, cause error) error {
	if cause == nil {
		return nil
	}
	return fmt.Errorf("%w: %v", base, cause)
}

func formatted(base error, message string, args ...interface{}) error {
	msg := fmt.Sprintf(message, args...)
	return fmt.Errorf("%w: %v", base, msg)
}

func Internal(cause error) error {
	return caused(ErrInternal, cause)
}

func Internalf(format string, args ...interface{}) error {
	return formatted(ErrInternal, format, args...)
}

func BadRequest(cause error) error {
	return caused(ErrBadRequest, cause)
}

func BadRequestf(format string, args ...interface{}) error {
	return formatted(ErrBadRequest, format, args...)
}

func NotFound(cause error) error {
	return caused(ErrNotFound, cause)
}

func NotFoundf(format string, args ...interface{}) error {
	return formatted(ErrNotFound, format, args...)
}

func NoAccess(cause error) error {
	return caused(ErrNoAccess, cause)
}

func NoAccessf(format string, args ...interface{}) error {
	return formatted(ErrNoAccess, format, args...)
}

func GetType(err error) string {
	for {
		if err == nil {
			return "unspecified"
		}
		if err == ErrHalt {
			return "cancel"
		}
		if err == ErrInternal {
			return "internal"
		}
		if err == ErrBadRequest {
			return "bad request"
		}
		if err == ErrNotFound {
			return "not found"
		}
		if err == ErrNoAccess {
			return "no access"
		}
		err = errors.Unwrap(err) // eventually returns nil
	}
}

func IsSpecified(err error) bool {
	for {
		if err == nil {
			return false
		}
		if err == ErrHalt ||
			err == ErrInternal ||
			err == ErrBadRequest ||
			err == ErrNoAccess ||
			err == ErrNotFound {
			return true
		}
		err = errors.Unwrap(err) // Eventually returns nil
	}
}

// HTTPCode returns an HTTP code for the given error. If the error is nil or
// ErrHalt, this returns 200 OK.
func HTTPCode(err error) int {
	if err == nil {
		return netHTTP.StatusOK
	}
	for {
		// I wrote this as a switch and a `switch err` but it _didn't work_.
		if err == ErrHalt {
			return netHTTP.StatusOK
		}
		if err == ErrNoAccess {
			return netHTTP.StatusUnauthorized
		}
		if err == ErrBadRequest {
			return netHTTP.StatusBadRequest
		}
		if err == ErrNotFound {
			return netHTTP.StatusNotFound
		}
		if err == nil || err == ErrInternal {
			return netHTTP.StatusInternalServerError
		}

		err = errors.Unwrap(err) // Eventually returns nil
	}
}

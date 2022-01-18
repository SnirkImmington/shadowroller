package http

import (
	netHTTP "net/http"
)

var _ Response = (*wrappedResponse)(nil)

var _ WrappedResponse = (*wrappedResponse)(nil)

type WrappedResponse interface {
	Inner() Response
}

// wrappedResponse is an netHTTP.Response which records its status and written amount.
type wrappedResponse struct {
	inner   netHTTP.ResponseWriter
	status  int
	written int
}

func wrapResponse(writer Response) *wrappedResponse {
	return &wrappedResponse{inner: writer, status: netHTTP.StatusOK, written: 0}
}

func (w *wrappedResponse) Header() netHTTP.Header {
	return w.inner.Header()
}

func (w *wrappedResponse) Write(input []byte) (int, error) {
	written, err := w.inner.Write(input)
	w.written += written
	return written, err
}

func (w *wrappedResponse) WriteHeader(code int) {
	w.status = code
}

func (w *wrappedResponse) Flush() {
	if f, ok := w.inner.(netHTTP.Flusher); ok {
		f.Flush()
	}
}

func (w *wrappedResponse) Inner() Response {
	return w.inner
}

package routes

import (
	"net/http"
)

var _ Response = (*wrappedResponse)(nil)

type wrappedResponse struct {
	inner   http.ResponseWriter
	status  int
	written int
}

func wrapResponse(writer Response) *wrappedResponse {
	return &wrappedResponse{inner: writer, status: http.StatusOK, written: 0}
}

func (w *wrappedResponse) Header() http.Header {
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
